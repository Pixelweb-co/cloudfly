"""
application/vector_worker.py

Worker that listens to product.updates and synchronizes Qdrant vector database.
"""
import json
import logging
from typing import Dict, List

from openai import AsyncOpenAI
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct

from application.config import config

logger = logging.getLogger("vector-worker")

class VectorSyncWorker:
    def __init__(self, qdrant: QdrantClient):
        self._qdrant = qdrant
        self._openai = AsyncOpenAI(api_key=config.openai_api_key)

    async def handle_product_update(self, payload: dict | str):
        """
        Processes a product update or delete event.
        """
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except Exception as e:
                logger.error(f"❌ Received product update as invalid JSON string: {payload[:100]}... Error: {e}")
                return

        if not isinstance(payload, dict):
            logger.error(f"❌ Received product update with invalid type {type(payload)}: {payload}")
            return

        product_id = payload.get("id")
        tenant_id = payload.get("tenantId")
        operation = payload.get("operation")

        if not product_id:
            logger.warning("Received product update without ID", extra={"payload": payload})
            return

        if operation == "DELETE":
            logger.info(f"🗑️ Deleting product {product_id} from Qdrant", extra={"product_id": product_id, "tenant_id": tenant_id})
            try:
                self._qdrant.delete(
                    collection_name="products",
                    points_selector=[product_id]
                )
                logger.info(f"✅ Product {product_id} deleted from Qdrant")
            except Exception as exc:
                logger.error(f"❌ Failed to delete product {product_id} from Qdrant", extra={"error": str(exc)})
            return

        # Upsert logic (CREATE or UPDATE)
        logger.info(f"🔄 Syncing product {product_id} to Qdrant", extra={"product_id": product_id, "tenant_id": tenant_id})
        
        try:
            # We build the searchable text similar to sync_products.py
            # Note: The Java backend sends ProductCreateRequest which might have slightly different field names than DB
            name = payload.get("productName", "")
            description = payload.get("description", "")
            price = payload.get("price", 0)
            brand = payload.get("brand", "")
            model = payload.get("model", "")
            product_type = payload.get("productType", "")
            
            # For categories, we might not have names here, just IDs. 
            # Ideally the event should include names, but if not, we do our best.
            # In sync_products.py it fetches names from DB.
            searchable_text = f"Nombre: {name}\nDescripción: {description}\nCategoría/Tipo: {product_type}\nMarca: {brand}\nModelo: {model}\nPrecio: {price}"
            
            response = await self._openai.embeddings.create(
                input=searchable_text, 
                model="text-embedding-3-small"
            )
            vector = response.data[0].embedding

            qdrant_payload = {
                "product_id": product_id,
                "tenant_id": tenant_id,
                "name": name,
                "description": description,
                "price": float(price or 0),
                "stock": int(payload.get("inventoryQty") or 0),
                "manage_stock": bool(payload.get("manageStock")),
                "image_url": payload.get("imageUrl", "") # Not always present in backend DTO yet?
            }

            self._qdrant.upsert(
                collection_name="products",
                points=[PointStruct(id=product_id, vector=vector, payload=qdrant_payload)]
            )
            logger.info(f"✅ Product {product_id} synced to Qdrant successfully")
            
        except Exception as exc:
            logger.error(f"❌ Failed to sync product {product_id} to Qdrant", extra={"error": str(exc)})
