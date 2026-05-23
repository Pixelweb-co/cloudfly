import sqlite3
import os
import sys

# Agregar el directorio raíz de pos-python al PATH
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_dir)

from database.queries import save_order
from network.api_client import APIClient
from network.sync_service import SyncService

db_path = os.path.join(root_dir, "pos_local.db")
print("Base de datos local:", db_path)

# Insertar la orden usando save_order de la misma lógica del POS
items = [
    {
        'product_id': 2, # Jetski
        'quantity': 2,
        'price': 20000.0,
        'discount': 0.0,
        'total': 40000.0
    }
]

print("Guardando orden de prueba en base de datos local SQLite...")
order_id, invoice_num = save_order(
    customer_id=2, # Cloudfly Manager
    items=items,
    subtotal=40000.0,
    discount=0.0,
    tax=0.0,
    total=40000.0,
    payment_method="CASH",
    created_by="Cajero de Pruebas"
)
print(f"Orden local guardada: ID={order_id}, Número={invoice_num}")

# Desmarcarla para asegurar que is_synced sea 0 (aunque save_order la crea con 0 por defecto)
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("UPDATE orders SET is_synced = 0 WHERE id = ?", (order_id,))
conn.commit()
conn.close()

# Cargar APIClient y realizar sincronización
print("\nIniciando sincronización manual al VPS...")
api_client = APIClient()
sync_service = SyncService(api_client)

synced = sync_service.sync_pending_orders()
print(f"\nSincronización terminada. Órdenes procesadas: {synced}")
