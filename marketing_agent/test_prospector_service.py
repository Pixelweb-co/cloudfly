import unittest
from unittest.mock import patch, MagicMock
import json
from services.prospector_service import ProspectorService

class TestProspectorService(unittest.TestCase):
    """Test suite for ProspectorService."""
    
    def setUp(self):
        self.service = ProspectorService()
        self.test_product = {
            "id": 1,
            "productName": "Software POS para Restaurantes",
            "description": "Sistema de punto de venta rápido para restaurantes y cafeterías.",
            "image_url": "http://example.com/image.png"
        }
        
    @patch('services.prospector_service.requests.post')
    def test_generate_keywords_success(self, mock_post):
        """Test successful keyword generation using OpenRouter."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": "restaurantes"
                }
            }]
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response
        
        keyword = self.service.generate_keywords("Software POS", "POS para restaurantes")
        self.assertEqual(keyword, "restaurantes")
        mock_post.assert_called_once()

    @patch('services.prospector_service.requests.post')
    def test_generate_keywords_fallback(self, mock_post):
        """Test keyword generation fallback on API error."""
        mock_post.side_effect = Exception("API Error")
        
        keyword = self.service.generate_keywords("POS Restaurante", "POS para restaurantes")
        self.assertEqual(keyword, "restaurantes")

    @patch('services.prospector_service.requests.post')
    def test_fetch_leads_from_generator_success(self, mock_post):
        """Test fetching leads successfully from lead-generator FastAPI."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "status": "success",
            "leads": [
                {"name": "Restaurante Delicia", "phone": "573001234567", "company": "Delicia SAS", "score": "HOT"},
                {"name": "Café Central", "phone": "573009876543", "company": "Café Central", "score": "WARM"}
            ]
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response
        
        leads = self.service.fetch_leads_from_generator("restaurantes", limit=2)
        self.assertEqual(len(leads), 2)
        self.assertEqual(leads[0]["name"], "Restaurante Delicia")
        mock_post.assert_called_once()

    @patch('mysql.connector.connect')
    def test_save_leads_to_crm(self, mock_connect):
        """Test saving leads to CRM contacts database."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        # Mock duplicate check to return None (no duplicate), and insert returns contact ID
        mock_cursor.fetchone.return_value = None
        mock_cursor.lastrowid = 100
        
        leads = [
            {"name": "Restaurante Delicia", "phone": "573001234567"},
            {"name": "Café Central", "phone": "573009876543"}
        ]
        
        contact_ids = self.service.save_leads_to_crm(tenant_id=1, company_id=1, leads=leads)
        self.assertEqual(contact_ids, [100, 100])
        self.assertEqual(mock_cursor.execute.call_count, 4) # 2 checks + 2 inserts
        mock_conn.commit.assert_called_once()

    @patch('mysql.connector.connect')
    def test_create_campaign(self, mock_connect):
        """Test campaign creation in database."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        
        mock_cursor.lastrowid = 500
        
        campaign_id = self.service.create_campaign(
            tenant_id=1, company_id=1, product_id=1,
            message_text="Hello", media_url="http://media.png"
        )
        self.assertEqual(campaign_id, 500)
        mock_conn.commit.assert_called_once()

    @patch('redis.Redis')
    def test_sync_redis_campaign_context(self, mock_redis_class):
        """Test syncing campaign context to Redis."""
        mock_redis = MagicMock()
        mock_redis_class.return_value = mock_redis
        
        self.service.sync_redis_campaign_context(
            contact_ids=[100, 200], campaign_id=500,
            product_id=1, company_id=1
        )
        self.assertEqual(mock_redis.hset.call_count, 2)
        self.assertEqual(mock_redis.expire.call_count, 2)

if __name__ == '__main__':
    unittest.main()
