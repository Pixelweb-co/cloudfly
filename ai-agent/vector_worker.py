import os
import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor
from confluent_kafka import Consumer, KafkaError, KafkaException
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from openai import OpenAI
import config
import mysql.connector

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("vector_worker")

# Qdrant Config
QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
COLLECTION_NAME = "products"

try:
    qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    # Ensure collection exists
    if not qdrant.collection_exists(COLLECTION_NAME):
        qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
        )
        logger.info(f"Créated Qdrant collection: {COLLECTION_NAME}")
except Exception as e:
    logger.error(f"Failed to connect to Qdrant: {e}")

openai_client = OpenAI(api_key=config.OPENAI_API_KEY)

def get_embedding(text):
    response = openai_client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def get_db_connection():
    return mysql.connector.connect(
        host=config.DB_HOST,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        database=config.DB_NAME
    )

def get_category_names(category_ids):
    if not category_ids:
        return []
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        format_strings = ','.join(['%s'] * len(category_ids))
        cursor.execute(f"SELECT name FROM categorias WHERE id IN ({format_strings})", tuple(category_ids))
        names = [row[0] for row in cursor.fetchall()]
        conn.close()
        return names
    except Exception as e:
        logger.error(f"Error fetching category names: {e}")
        return []

def process_product_update(msg_value):
    try:
        product = json.loads(msg_value)
        # Handle double encoding
        while isinstance(product, str):
            try:
                decoded = json.loads(product)
                if decoded == product:
                    break
                product = decoded
            except Exception:
                break

        if not isinstance(product, dict):
            logger.error(f"Invalid product payload type: {type(product)}")
            return

        # Handle deletes if status == DELETED or similar
        operation = product.get("operation")
        product_id = product.get("id")
        tenant_id = product.get("tenantId")
        if not product_id:
            logger.error("Product ID missing in event")
            return

        if operation == "DELETE":
            logger.info(f"🗑️ Deleting product {product_id} from Qdrant")
            try:
                qdrant.delete(
                    collection_name=COLLECTION_NAME,
                    points_selector=[product_id]
                )
                logger.info(f"✅ Product {product_id} deleted from Qdrant")
            except Exception as e:
                logger.error(f"❌ Error deleting product {product_id}: {e}")
            return

        # Fetch category names if present
        category_ids = product.get("categoryIds", [])
        category_names = get_category_names(category_ids)
        categories_str = ", ".join(category_names)

        # Prepare string for vectorization
        searchable_text = f"""
        Nombre: {product.get('productName', '')}
        Categorías: {categories_str}
        Descripción: {product.get('description', '')}
        Categoría/Tipo: {product.get('productType', '')}
        Marca: {product.get('brand', '')}
        Modelo: {product.get('model', '')}
        Precio: {product.get('price', '')}
        """

        vector = get_embedding(searchable_text.strip())

        # Construct payload (metadata)
        payload = {
            "product_id": product_id,
            "tenant_id": tenant_id,
            "name": product.get("productName", ""),
            "description": product.get("description", ""),
            "price": product.get("price", 0),
            "stock": product.get("inventoryQty", 0),
            "manage_stock": product.get("manageStock", False),
            "categories": category_names,
            "image_url": "" # Simplifica: tomar la primera si existiera en un arreglo, o null
        }
        
        # In java, we might pass categoryIds or imageUrls, if present we can add them here
        
        qdrant.upsert(
            collection_name=COLLECTION_NAME,
            points=[
                PointStruct(
                    id=product_id, # Using MySQL native ID as vector ID
                    vector=vector,
                    payload=payload
                )
            ]
        )
        logger.info(f"✅ Vectorized product {product_id} for tenant {tenant_id}")
    except Exception as e:
        logger.error(f"❌ Error vectorizing product: {e}")

def main():
    conf = {
        'bootstrap.servers': config.KAFKA_BOOTSTRAP_SERVERS,
        'group.id': 'vector-worker-group',
        'auto.offset.reset': 'earliest' # Ensure we don't miss indexations
    }

    consumer = Consumer(conf)
    consumer.subscribe(['product.updates'])
    
    logger.info("🚀 Vector Worker started, listening to 'product.updates'")
    
    executor = ThreadPoolExecutor(max_workers=5)

    try:
        while True:
            msg = consumer.poll(timeout=1.0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                elif msg.error():
                    logger.error(f"Kafka error: {msg.error()}")
                    continue

            value = msg.value().decode('utf-8')
            logger.info("Received product update event")
            executor.submit(process_product_update, value)

    except KeyboardInterrupt:
        pass
    finally:
        consumer.close()
        executor.shutdown(wait=True)

if __name__ == "__main__":
    main()
