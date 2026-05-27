import threading
import time
import os
import requests
from database.queries import get_pending_orders, mark_order_as_synced, get_connection
from network.api_client import APIClient

class SyncService:
    def __init__(self, api_client: APIClient, on_status_change_callback=None):
        self.api_client = api_client
        self.on_status_change = on_status_change_callback
        self.is_online = False
        self.running = False
        self.thread = None

    def start(self):
        """Inicia el hilo de sincronización en segundo plano."""
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._sync_loop, daemon=True)
            self.thread.start()

    def stop(self):
        """Detiene el hilo de sincronización."""
        self.running = False

    def _sync_loop(self):
        """Bucle periódico de ping y sincronización."""
        while self.running:
            # 1. Comprobar red
            was_online = self.is_online
            self.is_online = self.api_client.check_health()
            
            # Si cambió el estado de conexión, disparar callback
            if self.is_online != was_online and self.on_status_change:
                self.on_status_change(self.is_online)
                
            # 2. Si hay red, sincronizar órdenes locales pendientes
            if self.is_online:
                try:
                    self.sync_pending_orders()
                    self.sync_catalog_data()
                except Exception as e:
                    print(f"Error en bucle de sincronización: {e}")
                    
            # Esperar 120 segundos (2 minutos) antes del siguiente ciclo
            time.sleep(120)

    def sync_pending_orders(self):
        """Envía órdenes pendientes al backend y gatilla la generación de su factura."""
        pending = get_pending_orders()
        if not pending:
            return 0
            
        synced_count = 0
        for order in pending:
            # Subir orden a la API
            res, err = self.api_client.create_order(order)
            if not err:
                # Éxito! Marcar en la base de datos local
                mark_order_as_synced(order['id'])
                synced_count += 1
                print(f"Orden local {order['invoice_number']} sincronizada con éxito al backend.")
                
                # Gatillar de inmediato la generación de la factura a partir de la orden subida
                order_id = res.get('id') if isinstance(res, dict) else None
                if order_id:
                    inv_res, inv_err = self.api_client.create_invoice_from_order(order_id)
                    if not inv_err:
                        print(f"Factura generada con éxito en la nube para Orden ID {order_id}.")
                    else:
                        print(f"Fallo al autogenerar factura en la nube para Orden ID {order_id}: {inv_err}")
                else:
                    print(f"No se pudo obtener el ID de la orden para autogenerar la factura en la nube.")
            else:
                print(f"Fallo al sincronizar orden local {order['invoice_number']}: {err}")
                
        return synced_count

    def sync_catalog_data(self):
        """Descarga catálogo actualizado de productos y clientes del backend y los guarda en SQLite."""
        # 1. Descargar productos
        prods, err = self.api_client.fetch_products()
        if not err and isinstance(prods, list):
            conn = get_connection()
            cursor = conn.cursor()
            try:
                for p in prods:
                    # Robust category mapping
                    category_val = "General"
                    cat_names = p.get('categoryNames')
                    if cat_names and isinstance(cat_names, list) and len(cat_names) > 0:
                        category_val = cat_names[0]
                    elif isinstance(p.get('category'), dict):
                        category_val = p.get('category', {}).get('name', 'General')
                    elif p.get('category'):
                        category_val = str(p.get('category'))

                    # Map properties from api schema
                    prod_name = p.get('productName') or p.get('name') or "Sin Nombre"
                    prod_sku = p.get('barcode') or p.get('sku') or f"PROD-{p.get('id')}"
                    prod_price = float(p.get('price') or 0.0)
                    prod_sale_price = float(p.get('salePrice') if p.get('salePrice') is not None else prod_price)
                    prod_type = p.get('productType') or p.get('type') or "PRODUCT"
                    prod_stock = int(p.get('inventoryQty') if p.get('inventoryQty') is not None else p.get('stock') or 0)
                    prod_manage_stock = 1 if p.get('manageStock') is True else 0

                    # Upsert producto por backend_id
                    prod_images = p.get('imageUrls')
                    prod_image_path = None
                    if prod_images and isinstance(prod_images, list) and len(prod_images) > 0:
                        img_url = prod_images[0]
                        if img_url.startswith("http"):
                            prod_image_path = img_url
                        else:
                            base = self.api_client.base_url.rstrip('/')
                            prod_image_path = f"{base}/{img_url.lstrip('/')}"

                    # Descargar imagen en segundo plano si no existe localmente
                    if prod_image_path:
                        try:
                            # Directorio cache/images/ en la raíz del proyecto
                            root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                            cache_dir = os.path.join(root_dir, "cache", "images")
                            os.makedirs(cache_dir, exist_ok=True)
                            local_img_path = os.path.join(cache_dir, f"{p.get('id')}.png")
                            
                            if not os.path.exists(local_img_path) or os.path.getsize(local_img_path) == 0:
                                headers = self.api_client.get_headers()
                                img_res = requests.get(prod_image_path, headers=headers, timeout=5)
                                if img_res.status_code == 200:
                                    with open(local_img_path, "wb") as img_file:
                                        img_file.write(img_res.content)
                                    print(f"Imagen descargada para producto {p.get('id')}: {local_img_path}")
                        except Exception as img_err:
                            print(f"Error descargando imagen para producto {p.get('id')}: {img_err}")

                    cursor.execute("""
                    INSERT INTO products (backend_id, name, sku, price, sale_price, category, type, stock, manage_stock, image_path)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(backend_id) DO UPDATE SET
                        name = excluded.name,
                        sku = excluded.sku,
                        price = excluded.price,
                        sale_price = excluded.sale_price,
                        category = excluded.category,
                        type = excluded.type,
                        stock = excluded.stock,
                        manage_stock = excluded.manage_stock,
                        image_path = excluded.image_path
                    """, (
                        p.get('id'),
                        prod_name,
                        prod_sku,
                        prod_price,
                        prod_sale_price,
                        category_val,
                        prod_type,
                        prod_stock,
                        prod_manage_stock,
                        prod_image_path
                    ))
                conn.commit()
            except Exception as e:
                conn.rollback()
                print(f"Error guardando productos sincronizados: {e}")
            finally:
                conn.close()

        # 2. Descargar clientes
        contacts, err = self.api_client.fetch_contacts()
        if not err and isinstance(contacts, list):
            conn = get_connection()
            cursor = conn.cursor()
            try:
                for c in contacts:
                    # Sincronizar si es cliente (o si el tipo no está definido/es nulo)
                    if c.get('type') in ('CUSTOMER', None, ''):
                        cursor.execute("""
                        INSERT INTO customers (backend_id, name, phone, email, address, points)
                        VALUES (?, ?, ?, ?, ?, ?)
                        ON CONFLICT(backend_id) DO UPDATE SET
                            name = excluded.name,
                            phone = excluded.phone,
                            email = excluded.email,
                            address = excluded.address
                        """, (
                            c.get('id'),
                            c.get('name'),
                            c.get('phone') or "",
                            c.get('email') or "",
                            c.get('address') or "",
                            c.get('points') or 0
                        ))
                conn.commit()
            except Exception as e:
                conn.rollback()
                print(f"Error guardando contactos sincronizados: {e}")
            finally:
                conn.close()
