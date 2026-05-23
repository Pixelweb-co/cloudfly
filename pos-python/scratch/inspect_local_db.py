import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "pos_local.db")
print("Ruta de base de datos:", db_path)

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print("\n--- PRODUCTOS LOCALES ---")
cursor.execute("SELECT id, backend_id, name, price, stock FROM products LIMIT 5")
for r in cursor.fetchall():
    print(dict(r))

print("\n--- CLIENTES LOCALES ---")
cursor.execute("SELECT id, backend_id, name, email FROM customers LIMIT 5")
for r in cursor.fetchall():
    print(dict(r))

print("\n--- ÚLTIMAS ÓRDENES LOCALES ---")
cursor.execute("SELECT id, invoice_number, is_synced, total, created_at FROM orders ORDER BY created_at DESC LIMIT 5")
for r in cursor.fetchall():
    print(dict(r))

conn.close()
