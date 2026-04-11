import mysql.connector
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from openai import OpenAI
import config
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sync")

def main():
    qdrant = QdrantClient(host=config.QDRANT_HOST, port=config.QDRANT_PORT)
    if not qdrant.collection_exists("products"):
        qdrant.create_collection(
            collection_name="products",
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
        )
        logger.info("Created collection 'products'")

    openai_client = OpenAI(api_key=config.OPENAI_API_KEY)

    conn = mysql.connector.connect(
        host=config.DB_HOST,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        database=config.DB_NAME
    )
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM productos")
    products = cursor.fetchall()
    
    if not products:
        logger.info("No products found in DB.")
        return

    logger.info(f"Found {len(products)} products to sync.")
    
    points = []
    for prod in products:
        searchable_text = f"Nombre: {prod.get('product_name', '')}\nDescripción: {prod.get('description', '')}\nCategoría/Tipo: {prod.get('product_type', '')}\nMarca: {prod.get('brand', '')}\nModelo: {prod.get('model', '')}\nPrecio: {prod.get('price', '')}"
        
        response = openai_client.embeddings.create(input=searchable_text, model="text-embedding-3-small")
        vector = response.data[0].embedding
        
        payload = {
            "product_id": prod.get("id"),
            "tenant_id": prod.get("tenant_id"),
            "name": prod.get("product_name", ""),
            "description": prod.get("description", ""),
            "price": float(prod.get("price") or 0),
            "stock": int(prod.get("inventory_qty") or 0),
            "manage_stock": bool(prod.get("manage_stock")),
            "image_url": prod.get("image_url", "")
        }
        
        points.append(PointStruct(id=prod.get("id"), vector=vector, payload=payload))
        
    if points:
        qdrant.upsert(collection_name="products", points=points)
        logger.info(f"Successfully synced {len(points)} products to Qdrant.")
    
    conn.close()

if __name__ == "__main__":
    main()
