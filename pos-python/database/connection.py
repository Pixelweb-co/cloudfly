import sqlite3
import os
import sys

def get_base_path():
    """
    Retorna la ruta base donde se almacenan los datos persistentes.
    - En producción (.exe): C:\\ProgramData\\CloudFly POS\\
    - En desarrollo (script Python): directorio raíz del proyecto pos-python/
    """
    if getattr(sys, 'frozen', False):
        # Ejecutando como .exe compilado por PyInstaller
        base = os.path.join(os.environ.get('PROGRAMDATA', 'C:\\ProgramData'), 'CloudFly POS')
    else:
        # Ejecutando como script Python normal (desarrollo)
        base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.makedirs(base, exist_ok=True)
    return base

DB_NAME = os.path.join(get_base_path(), "pos_local.db")

def get_connection():
    """Retorna una conexión a la base de datos SQLite local."""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row  # Permite acceder a columnas por nombre
    return conn

def init_db():
    """Crea las tablas de la base de datos si no existen y precarga datos demo."""
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Tabla de Productos y Servicios
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        backend_id INTEGER UNIQUE,
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        price REAL NOT NULL,
        sale_price REAL,
        category TEXT,
        type TEXT CHECK(type IN ('PRODUCT', 'SERVICE')) DEFAULT 'PRODUCT',
        duration_mins INTEGER DEFAULT 0,
        stock INTEGER DEFAULT 0,
        manage_stock INTEGER DEFAULT 1,
        image_path TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Tabla de Clientes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        backend_id INTEGER UNIQUE,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        points INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 3. Tabla de Órdenes (Cabecera)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE,
        customer_id INTEGER,
        subtotal REAL NOT NULL,
        discount REAL DEFAULT 0,
        tax REAL DEFAULT 0,
        total REAL NOT NULL,
        payment_method TEXT CHECK(payment_method IN ('CASH', 'CARD', 'TRANSFER', 'OTHER')),
        created_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_synced INTEGER DEFAULT 0,
        FOREIGN KEY(customer_id) REFERENCES customers(id)
    );
    """)

    # 4. Tabla de Detalle de Órdenes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        discount REAL DEFAULT 0,
        total REAL NOT NULL,
        FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id)
    );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Base de datos local inicializada exitosamente.")
