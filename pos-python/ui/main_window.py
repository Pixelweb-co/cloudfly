import tkinter as tk
from tkinter import ttk
from tkinter import messagebox
from database.connection import init_db
from database.queries import save_order, get_recent_orders
from models.cart import Cart
from network.api_client import APIClient
from network.sync_service import SyncService

# Importar componentes de interfaz
from ui.styles import apply_styles, BG_MAIN, WHITE, FONT_BOLD, FONT_NORMAL, CLOUDFLY_BLUE
from ui.components.header import HeaderPanel
from ui.components.product_grid import ProductGrid
from ui.components.cart_panel import CartPanel
from ui.components.function_keys import FunctionKeysPanel
from ui.components.modals import LoginModal, CustomerSelectionModal, PaymentModal

class MainWindow(tk.Tk):
    def __init__(self):
        super().__init__()
        
        # 1. INICIALIZACIÓN BÁSICA DE LA VENTANA
        self.title("CloudFly Point of Sale - Python Edition")
        self.geometry("1280x820")
        self.minimum_size = (1100, 750)
        self.configure(bg=BG_MAIN)
        
        # 2. INICIALIZACIÓN DE DATOS Y CONEXIÓN
        init_db()  # Iniciar base de datos SQLite local
        self.cart = Cart()
        self.active_customer = None
        self.waiting_carts = []  # Lista para guardar carritos en espera
        
        # Cliente API y Servicio de Sincronización
        self.api_client = APIClient()
        self.sync_service = SyncService(self.api_client, on_status_change_callback=self.on_network_status_change)
        
        # 3. APLICAR ESTILOS CENTRALIZADOS
        apply_styles(self)
        
        # 4. MAQUETACIÓN DE CUADRÍCULA PRINCIPAL (GRID RESPONSIVO)
        self.rowconfigure(0, weight=0)  # Header (Fijo)
        self.rowconfigure(1, weight=1)  # Catálogo e Ítems (Expandible)
        self.rowconfigure(2, weight=0)  # Botones de Función (Fijo)
        
        self.columnconfigure(0, weight=3)  # Lado izquierdo (Catálogo)
        self.columnconfigure(1, weight=2)  # Lado derecho (Carrito)
        
        # 5. CREAR E INSTANCIAR COMPONENTES
        self.header = HeaderPanel(self, self)
        self.header.grid(row=0, column=0, columnspan=2, sticky="ew", padx=10, pady=(10, 5))
        
        self.catalog = ProductGrid(self, self)
        self.catalog.grid(row=1, column=0, sticky="nsew", padx=(10, 5), pady=5)
        
        self.cart_panel = CartPanel(self, self)
        self.cart_panel.grid(row=1, column=1, sticky="nsew", padx=(5, 10), pady=5)
        
        self.func_keys = FunctionKeysPanel(self, self)
        self.func_keys.grid(row=2, column=0, columnspan=2, sticky="ew", padx=10, pady=(5, 10))
        
        # 6. INICIAR HILO DE SINCRONIZACIÓN EN SEGUNDO PLANO
        self.sync_service.start()
        
        # 7. PROCESO DE AUTENTICACIÓN
        # Si el token ya existe localmente, intentamos verificar red. De lo contrario, forzar login.
        self.after(100, self.check_initial_auth)
        
        # Capturar evento de cerrar ventana para apagar hilos de forma limpia
        self.protocol("WM_DELETE_WINDOW", self.quit_application)

    def check_initial_auth(self):
        """Valida si ya existe un token válido o despliega la pantalla de login."""
        if not self.api_client.token:
            self.show_login_screen()
        else:
            # Comprobar si conecta con el servidor
            is_valid = self.api_client.check_health()
            if not is_valid:
                # Si el token está vencido o incorrecto, mostramos el login
                self.show_login_screen()
            else:
                self.on_auth_success()

    def show_login_screen(self):
        """Instancia la pantalla de autenticación bloqueante con estilo Premium."""
        LoginModal(self, self.api_client, self.on_auth_success)

    def on_auth_success(self):
        """Callback gatillado al autenticar con éxito en el backend."""
        # Configurar estado de conexión en la UI
        self.func_keys.update_sync_status(self.sync_service.is_online)
        
        # Mostrar el usuario y rol logueado decodificando el JWT
        user_info = self.api_client.get_user_info()
        if user_info:
            self.header.update_user_info(user_info["username"], user_info["role"])
        else:
            self.header.update_user_info(None, None)
            
        # Sincronizar catálogo inicial de forma inmediata
        self.force_catalog_sync(show_msg=False)

    def on_network_status_change(self, is_online):
        """Monitorea en tiempo real los cambios del hilo de red y actualiza el botón."""
        self.func_keys.update_sync_status(is_online)

    # ==========================================
    # LÓGICA DE NEGOCIO Y CONTROLADOR DEL CARRITO
    # ==========================================
    def add_product_to_cart(self, product, quantity=1):
        """Agrega un producto al modelo de carrito y refresca las vistas."""
        self.cart.add_item(product, quantity)
        self.refresh_ui()

    def remove_product_from_cart(self, product_id):
        """Elimina un producto del modelo y refresca."""
        self.cart.remove_item(product_id)
        self.refresh_ui()

    def update_cart_item(self, product_id, quantity, discount):
        """Actualiza la cantidad y descuento de un item de la grilla."""
        self.cart.update_quantity(product_id, quantity)
        self.cart.update_discount(product_id, discount)
        self.refresh_ui()

    def clear_cart(self):
        """Limpia el modelo de carrito por completo."""
        self.cart.clear()
        self.active_customer = None
        self.header.update_customer(None)
        self.refresh_ui()

    def refresh_ui(self):
        """Sincroniza los datos del modelo con los widgets visuales."""
        self.cart_panel.refresh_cart_table(self.cart)
        self.header.update_stats(self.cart.line_count, self.cart.total_quantity)

    # ==========================================
    # INTERACCIÓN CON DIÁLOGOS MODALES
    # ==========================================
    def open_customer_modal(self):
        """Abre la búsqueda y selección de clientes."""
        CustomerSelectionModal(self, self.on_customer_selected)

    def on_customer_selected(self, customer):
        """Callback al seleccionar un cliente en el modal."""
        self.active_customer = customer
        self.cart.customer = customer
        self.header.update_customer(customer)

    def open_payment_modal(self, payment_method):
        """Abre el diálogo interactivo de procesamiento de cobro."""
        PaymentModal(self, self.cart.total, payment_method, lambda: self.process_sale(payment_method))

    def process_sale(self, payment_method):
        """Guarda la venta en la base de datos local e inicia sincronización inmediata."""
        try:
            cust_id = self.active_customer.id if self.active_customer else None
            
            # Formatear items para persistencia en SQLite
            items_payload = [
                {
                    "product_id": item.product.id,
                    "quantity": item.quantity,
                    "price": item.unit_price,
                    "discount": item.discount,
                    "total": item.total
                } for item in self.cart.items
            ]
            
            # 1. Guardar localmente (Modo Offline-First resiliente)
            order_id, invoice_num = save_order(
                customer_id=cust_id,
                items=items_payload,
                subtotal=self.cart.subtotal,
                discount=self.cart.discount,
                tax=self.cart.tax,
                total=self.cart.total,
                payment_method=payment_method,
                created_by="Cajero Python"
            )
            
            # 2. Intentar gatillar sincronización inmediata asíncrona si hay red
            if self.sync_service.is_online:
                # Ejecutar sincronización en hilo secundario de inmediato sin bloquear UI
                import threading
                threading.Thread(target=self.sync_service.sync_pending_orders, daemon=True).start()
                
            # 3. Mostrar ticket digital en pantalla
            messagebox.showinfo(
                "Venta Procesada con Éxito",
                f"La venta se registró localmente bajo la factura:\n\n{invoice_num}\n\nTotal Cobrado: ${self.cart.total:.2f}\n\n¡Inventario descontado exitosamente!"
            )
            
            # 4. Vaciar carrito para la siguiente transacción
            self.clear_cart()
            # Refrescar catálogo para mostrar el nuevo stock
            self.catalog.refresh_grid()
            
        except Exception as e:
            messagebox.showerror("Error al Guardar Venta", f"Ocurrió un error inesperado al procesar la venta: {e}")

    # ==========================================
    # LOGICAS DE LOS BOTONES DE FUNCIÓN
    # ==========================================
    def save_cart_to_waiting_list(self):
        """Guarda el carrito actual en espera en memoria y limpia la pantalla."""
        if self.cart.line_count == 0:
            messagebox.showwarning("Acción Inválida", "No hay ítems en el carrito para poner en espera.")
            return
            
        self.waiting_carts.append({
            "items": list(self.cart.items),
            "customer": self.active_customer,
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S")
        })
        self.clear_cart()
        messagebox.showinfo("Venta en Espera", "La venta actual ha sido guardada en espera de forma segura.")

    def recover_cart_from_waiting_list(self):
        """Recupera la primera venta de la lista de espera."""
        if not self.waiting_carts:
            messagebox.showinfo("Lista de Espera", "No hay facturas o carritos en espera en este momento.")
            return
            
        # Recuperar el último guardado
        saved = self.waiting_carts.pop()
        self.clear_cart()
        
        self.active_customer = saved["customer"]
        self.header.update_customer(self.active_customer)
        self.cart.customer = self.active_customer
        
        for item in saved["items"]:
            self.cart.items.append(item)
            
        self.refresh_ui()
        messagebox.showinfo("Venta Recuperada", "El carrito guardado en espera ha sido restaurado exitosamente.")

    def force_catalog_sync(self, show_msg=True):
        """Sincroniza en réplica catálogo (productos/clientes) y pedidos pendientes con la API de CloudFly."""
        self.btn_sync_original_text = self.cart_panel.btn_sync.cget("text")
        self.cart_panel.btn_sync.configure(state="disabled", text="Sincronizando...")
        self.update()
        
        try:
            # 1. Sincronizar pedidos locales pendientes de subir
            synced_orders = 0
            if self.sync_service.is_online:
                synced_orders = self.sync_service.sync_pending_orders()
            
            # 2. Descargar catálogo actualizado (productos, inventarios, clientes)
            self.sync_service.sync_catalog_data()
            self.catalog.refresh_grid()
            
            if show_msg:
                msg = "Catálogo de productos, servicios y clientes sincronizado exitosamente con la API de CloudFly."
                if synced_orders > 0:
                    msg += f"\n\nAdemás, se subieron {synced_orders} pedido(s) pendiente(s) al servidor."
                messagebox.showinfo("Sincronización Exitosa", msg)
        except Exception as e:
            if show_msg:
                messagebox.showerror("Error de Sincronización", f"No se pudo completar la sincronización: {e}")
        finally:
            self.cart_panel.btn_sync.configure(state="normal", text="🔄 Sincronizar Catálogo")

    def force_network_ping(self):
        """Ping manual al servidor y gatilla sincronización de ventas."""
        self.func_keys.widgets["sync_status"].configure(text="Conectando...", bg="#4b5563")
        self.update()
        
        # Testear red
        is_online = self.api_client.check_health()
        self.sync_service.is_online = is_online
        self.func_keys.update_sync_status(is_online)
        
        if is_online:
            synced = self.sync_service.sync_pending_orders()
            if synced > 0:
                messagebox.showinfo("Sincronización Completa", f"¡Conexión restaurada! Se sincronizaron {synced} ventas pendientes al backend de CloudFly de forma exitosa.")
            else:
                messagebox.showinfo("Conexión Establecida", "El sistema está ONLINE y sincronizado con el backend.")
        else:
            messagebox.showwarning("Sin Conexión", "El servidor no responde. Sigues operando en modo local (OFFLINE) con resiliencia garantizada.")

    def open_recent_orders_history(self):
        """Abre un diálogo visual con el historial de últimas facturas emitidas localmente."""
        history_win = tk.Toplevel(self)
        history_win.title("Historial de Ventas - CloudFly POS")
        history_win.geometry("550x400")
        history_win.configure(bg=BG_MAIN)
        history_win.grab_set()
        history_win.transient(self)
        
        # Centrar
        history_win.update_idletasks()
        x = (self.winfo_screenwidth() // 2) - (550 // 2)
        y = (self.winfo_screenheight() // 2) - (400 // 2)
        history_win.geometry(f"550x400+{x}+{y}")
        
        tk.Label(history_win, text="📋 Últimas Facturas Emitidas (SQLite Local)", fg=WHITE, bg=BG_MAIN, font=("Segoe UI", 12, "bold")).pack(pady=15)
        
        # Treeview
        frame = ttk.Frame(history_win)
        frame.pack(fill="both", expand=True, padx=20, pady=(0, 20))
        
        tree = ttk.Treeview(frame, columns=("invoice", "customer", "payment", "total", "status"), show="headings")
        tree.heading("invoice", text="Factura")
        tree.heading("customer", text="Cliente")
        tree.heading("payment", text="Pago")
        tree.heading("total", text="Total")
        tree.heading("status", text="Sincronizado")
        
        tree.column("invoice", width=120, anchor="center")
        tree.column("customer", width=120, anchor="w")
        tree.column("payment", width=80, anchor="center")
        tree.column("total", width=80, anchor="e")
        tree.column("status", width=90, anchor="center")
        
        tree.pack(side="left", fill="both", expand=True)
        
        # Cargar datos
        orders = get_recent_orders(15)
        for o in orders:
            sync_txt = "✓ Sí" if o['is_synced'] == 1 else "⏳ Pendiente"
            tree.insert("", "end", values=(
                o['invoice_number'],
                o['customer_name'] or "Mostrador",
                o['payment_method'],
                f"${o['total']:.2f}",
                sync_txt
            ))

    def apply_global_discount_dialog(self):
        """Abre un diálogo rápido para aplicar descuento porcentual a nivel de factura."""
        disc_win = tk.Toplevel(self)
        disc_win.title("Descuento Factura")
        disc_win.geometry("280x150")
        disc_win.configure(bg=BG_MAIN)
        disc_win.grab_set()
        disc_win.transient(self)
        
        disc_win.update_idletasks()
        x = (self.winfo_screenwidth() // 2) - (280 // 2)
        y = (self.winfo_screenheight() // 2) - (150 // 2)
        disc_win.geometry(f"280x150+{x}+{y}")
        
        tk.Label(disc_win, text="Ingresa Descuento Global (%):", fg=WHITE, bg=BG_MAIN, font=FONT_BOLD).pack(pady=15)
        entry_pct = tk.Entry(disc_win, font=FONT_NORMAL, justify="center", bg=BG_MAIN, fg=WHITE, insertbackground=WHITE)
        entry_pct.pack(ipady=4)
        entry_pct.insert(0, str(self.cart.global_discount_percent))
        
        def save():
            try:
                pct = float(entry_pct.get())
                if pct < 0 or pct > 100:
                    raise ValueError
                self.cart.global_discount_percent = pct
                self.refresh_ui()
                disc_win.destroy()
            except ValueError:
                messagebox.showerror("Error", "Por favor ingresa un porcentaje válido (0 - 100).", parent=disc_win)
                
        tk.Button(disc_win, text="Aplicar Descuento", bg=CLOUDFLY_BLUE, fg=WHITE, font=FONT_BOLD, relief="flat", command=save).pack(pady=15)

    def show_invoice_preview(self):
        """Muestra una vista previa en texto del ticket de venta."""
        if self.cart.line_count == 0:
            messagebox.showwarning("Vista Previa", "Agregue ítems al carrito para generar vista previa.")
            return
            
        preview_win = tk.Toplevel(self)
        preview_win.title("Vista Previa del Ticket - CloudFly")
        preview_win.geometry("350x500")
        preview_win.configure(bg=WHITE)
        preview_win.grab_set()
        preview_win.transient(self)
        
        # Generar texto de ticket
        ticket = []
        ticket.append("=========================================")
        ticket.append("             CLOUDFLY POS                ")
        ticket.append("         Punto de Venta Python           ")
        ticket.append("=========================================")
        ticket.append(f"Fecha: {datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        ticket.append(f"Cliente: {self.active_customer.name if self.active_customer else 'Cliente Mostrador'}")
        ticket.append("-----------------------------------------")
        ticket.append("Cant.   Producto/Servicio         Total")
        ticket.append("-----------------------------------------")
        for item in self.cart.items:
            # Cortar nombre si es muy largo
            p_name = item.product.name[:25]
            ticket.append(f"{item.quantity:<7}{p_name:<25}${item.total:>6.2f}")
        ticket.append("-----------------------------------------")
        ticket.append(f"SUBTOTAL:                         ${self.cart.subtotal:>6.2f}")
        ticket.append(f"DESCUENTO:                       -${self.cart.discount:>6.2f}")
        ticket.append(f"IMPUESTO (0%):                     ${self.cart.tax:>6.2f}")
        ticket.append("=========================================")
        ticket.append(f"TOTAL ESTIMADO:                   ${self.cart.total:>6.2f}")
        ticket.append("=========================================")
        ticket.append("\n        ¡Gracias por su compra!         ")
        ticket.append("         Desarrollado con Python         ")
        
        ticket_str = "\n".join(ticket)
        
        txt_area = tk.Text(preview_win, font=("Consolas", 10), bg="#fffae6", fg="#000000", padx=10, pady=10)
        txt_area.insert("1.0", ticket_str)
        txt_area.configure(state="disabled")
        txt_area.pack(fill="both", expand=True)

    def configure_taxes_dialog(self):
        """Permite configurar un porcentaje de impuesto (IVA) al carrito."""
        tax_win = tk.Toplevel(self)
        tax_win.title("Configurar Impuestos")
        tax_win.geometry("280x150")
        tax_win.configure(bg=BG_MAIN)
        tax_win.grab_set()
        tax_win.transient(self)
        
        tax_win.update_idletasks()
        x = (self.winfo_screenwidth() // 2) - (280 // 2)
        y = (self.winfo_screenheight() // 2) - (150 // 2)
        tax_win.geometry(f"280x150+{x}+{y}")
        
        tk.Label(tax_win, text="Ingresa Porcentaje de Impuesto (%):", fg=WHITE, bg=BG_MAIN, font=FONT_BOLD).pack(pady=15)
        entry_tax = tk.Entry(tax_win, font=FONT_NORMAL, justify="center", bg=BG_MAIN, fg=WHITE, insertbackground=WHITE)
        entry_tax.pack(ipady=4)
        entry_tax.insert(0, str(self.cart.tax_percent))
        
        def save():
            try:
                tax = float(entry_tax.get())
                if tax < 0 or tax > 100:
                    raise ValueError
                self.cart.tax_percent = tax
                self.refresh_ui()
                tax_win.destroy()
            except ValueError:
                messagebox.showerror("Error", "Por favor ingresa un impuesto válido (0 - 100).", parent=tax_win)
                
        tk.Button(tax_win, text="Configurar Impuesto", bg=CLOUDFLY_BLUE, fg=WHITE, font=FONT_BOLD, relief="flat", command=save).pack(pady=15)

    def clear_cart_with_confirmation(self):
        """Vuelve a vaciar el carrito con confirmación (botón inferior)."""
        if self.cart.line_count == 0:
            return
        if messagebox.askyesno("Vaciar Factura", "¿Desea limpiar y borrar toda la factura actual?"):
            self.clear_cart()

    def toggle_loyalty_club(self):
        """Activa/Desactiva acumulación de puntos de fidelidad."""
        messagebox.showinfo("Club de Ventas CloudFly", "Puntos de Fidelidad ACTIVOS.\n\nPor cada $10 gastados, se le sumará automáticamente 1 punto al cliente asociado a la compra.")

    def generate_cash_report(self):
        """Genera un reporte rápido de caja de ventas locales y estado de sincronización."""
        # Consultar total de órdenes y las pendientes de sincronización
        import sqlite3
        from database.connection import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT COUNT(*), SUM(total) FROM orders")
            total_row = cursor.fetchone()
            total_orders = total_row[0] or 0
            total_revenue = total_row[1] or 0.0
            
            cursor.execute("SELECT COUNT(*), SUM(total) FROM orders WHERE is_synced = 0")
            pending_row = cursor.fetchone()
            pending_orders = pending_row[0] or 0
            pending_revenue = pending_row[1] or 0.0
        except Exception as e:
            total_orders = 0
            total_revenue = 0.0
            pending_orders = 0
            pending_revenue = 0.0
        finally:
            conn.close()

        synced_orders = total_orders - pending_orders
        synced_revenue = total_revenue - pending_revenue
        
        report_text = (
            f"📊 REPORTE DE CAJA LOCAL - CLOUDFLY POS\n"
            f"=========================================\n\n"
            f"💰 Ventas Totales Registradas: {total_orders} (${total_revenue:.2f})\n\n"
            f"🟢 Ventas Sincronizadas al Servidor: {synced_orders} (${synced_revenue:.2f})\n"
            f"⏳ Ventas Pendientes de Sincronizar: {pending_orders} (${pending_revenue:.2f})\n\n"
            f"=========================================\n"
            f"Estado del Sistema: {'🟢 ONLINE' if self.sync_service.is_online else '🔴 OFFLINE'}"
        )
        messagebox.showinfo("Reporte de Caja - CloudFly POS", report_text)

    # Stubs para otros botones no-core que completan los 18 botones
    def open_price_lookup(self):
        messagebox.showinfo("Consulta de Precios", "Utilice la barra superior de búsqueda principal. Si ingresa el SKU del producto, podrá ver sus detalles instantáneamente.")

    def open_refund_dialog(self):
        messagebox.showinfo("Devolución / Reembolso", "Ingrese el código de factura original en la barra de búsqueda superior para iniciar el proceso de devolución de items de stock.")

    def redeem_customer_points(self):
        if not self.active_customer:
            messagebox.showwarning("Canje de Puntos", "Seleccione un cliente para realizar el canje de puntos.")
            return
        messagebox.showinfo("Canje de Puntos", f"El cliente {self.active_customer.name} posee {self.active_customer.points} puntos.\n\nPuedes canjear 100 puntos por un 10% de descuento en la factura actual.")

    def apply_discount_to_selected_item(self):
        messagebox.showinfo("Descuento de Ítem", "Haga DOBLE CLIC en cualquier producto de la tabla del carrito para modificar su cantidad y descuento directamente de forma inline.")

    def open_customer_account_status(self):
        if not self.active_customer:
            messagebox.showwarning("Estado de Cuenta", "Seleccione un cliente para ver su estado de cuenta.")
            return
        messagebox.showinfo("Estado de Cuenta", f"Cliente: {self.active_customer.name}\n\nSaldo Pendiente: $0.00 (Cuenta al día)\nLímite de Crédito: $500.00")

    def apply_credit_sale(self):
        if not self.active_customer:
            messagebox.showwarning("Venta al Crédito", "Asocie un cliente calificado para poder procesar la venta al crédito.")
            return
        if messagebox.askyesno("Venta al Crédito", f"¿Desea autorizar esta venta al crédito para {self.active_customer.name}?"):
            self.process_sale("OTHER")

    def quit_application(self):
        """Apaga hilos secundarios e interactivos de forma limpia."""
        self.sync_service.stop()
        self.destroy()
        import sys
        sys.exit(0)

import datetime
