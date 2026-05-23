from database.connection import get_connection
import random
import string
import datetime

def get_all_products(category=None, search_query=None):
    """Obtiene productos filtrados opcionalmente por categoría o término de búsqueda."""
    conn = get_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM products WHERE 1=1"
    params = []
    
    if category and category != "Todos":
        query += " AND category = ?"
        params.append(category)
        
    if search_query:
        query += " AND (name LIKE ? OR sku LIKE ?)"
        search_term = f"%{search_query}%"
        params.extend([search_term, search_term])
        
    query += " ORDER BY name ASC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_product_by_sku(sku):
    """Busca un producto exactamente por su código de barras o SKU."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE sku = ?", (sku,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_all_categories():
    """Obtiene la lista de categorías únicas de productos en la base de datos."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT category FROM products WHERE category IS NOT NULL")
    rows = cursor.fetchall()
    conn.close()
    categories = ["Todos"] + [row[0] for row in rows]
    return categories

def get_all_customers(search_query=None):
    """Obtiene la lista de clientes, opcionalmente filtrados por búsqueda."""
    conn = get_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM customers"
    params = []
    
    if search_query:
        query += " WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?"
        search_term = f"%{search_query}%"
        params.extend([search_term, search_term, search_term])
        
    query += " ORDER BY name ASC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def generate_invoice_number():
    """Genera un número de factura único con formato FAC-PY-XXXXXX."""
    chars = "".join(random.choices(string.digits, k=6))
    return f"FAC-PY-{chars}"

def save_order(customer_id, items, subtotal, discount, tax, total, payment_method, created_by="Cajero"):
    """
    Guarda una venta en la base de datos local y descuenta stock si aplica.
    'items' debe ser una lista de diccionarios: [{'product_id': id, 'quantity': q, 'price': p, 'discount': d, 'total': t}]
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        invoice_num = generate_invoice_number()
        
        # 1. Insertar cabecera de orden
        cursor.execute("""
        INSERT INTO orders (invoice_number, customer_id, subtotal, discount, tax, total, payment_method, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (invoice_num, customer_id, subtotal, discount, tax, total, payment_method, created_by))
        
        order_id = cursor.lastrowid
        
        # 2. Insertar detalles y actualizar inventario
        for item in items:
            p_id = item['product_id']
            qty = item['quantity']
            price = item['price']
            item_disc = item.get('discount', 0)
            item_total = item['total']
            
            cursor.execute("""
            INSERT INTO order_items (order_id, product_id, quantity, price, discount, total)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (order_id, p_id, qty, price, item_disc, item_total))
            
            # Restar stock si es un producto físico y maneja stock
            cursor.execute("SELECT type, manage_stock, stock FROM products WHERE id = ?", (p_id,))
            prod = cursor.fetchone()
            if prod and prod['type'] == 'PRODUCT' and prod['manage_stock'] == 1:
                new_stock = prod['stock'] - qty
                cursor.execute("UPDATE products SET stock = ? WHERE id = ?", (new_stock, p_id))
        
        # 3. Sumar puntos al cliente si está seleccionado
        if customer_id:
            # Otorgar 1 punto por cada $10 gastados (ejemplo)
            puntos_ganados = int(total // 10)
            if puntos_ganados > 0:
                cursor.execute("UPDATE customers SET points = points + ? WHERE id = ?", (puntos_ganados, customer_id))

        conn.commit()
        return order_id, invoice_num
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_pending_orders():
    """Obtiene las órdenes locales que aún no se han sincronizado con el backend."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE is_synced = 0")
    rows = cursor.fetchall()
    orders = [dict(row) for row in rows]
    
    # Cargar los items de cada orden
    for order in orders:
        cursor.execute("""
        SELECT oi.*, p.name as product_name, p.backend_id as product_backend_id 
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
        """, (order['id'],))
        order['items'] = [dict(item) for item in cursor.fetchall()]
        
        # Cargar datos del cliente
        if order['customer_id']:
            cursor.execute("SELECT backend_id, name FROM customers WHERE id = ?", (order['customer_id'],))
            cust = cursor.fetchone()
            if cust:
                order['customer_backend_id'] = cust['backend_id']
                order['customer_name'] = cust['name']
            else:
                order['customer_backend_id'] = None
                order['customer_name'] = "Mostrador"
        else:
            order['customer_backend_id'] = None
            order['customer_name'] = "Mostrador"
            
    conn.close()
    return orders

def mark_order_as_synced(order_id, backend_id=None):
    """Marca una orden como sincronizada con el backend."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE orders SET is_synced = 1 WHERE id = ?", (order_id,))
    conn.commit()
    conn.close()

def get_recent_orders(limit=10):
    """Obtiene las facturas más recientes para visualización en el historial."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT o.*, c.name as customer_name 
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    ORDER BY o.created_at DESC
    LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
