# Meta Marketing API - Technical Specification Document

## Overview
This document provides the technical specification for integrating with Meta Marketing API v18.0 to create image ads programmatically.

---

## 1. Authentication Requirements

### 1.1 OAuth 2.0 Flow
- **Type**: Server-to-Server authentication
- **Token Type**: System User Access Token (recommended) or User Access Token
- **Authorization Header**: `Authorization: Bearer {ACCESS_TOKEN}`
- **Query Parameter Alternative**: `?access_token={ACCESS_TOKEN}`

### 1.2 Required Permissions
| Permission | Purpose |
|------------|---------|
| `ads_management` | Create and manage ads, campaigns, ad sets |
| `pages_read_engagement` | Read page data for ad creatives |
| `business_management` | Access business manager resources |

### 1.3 Required Environment Variables
```env
META_ACCESS_TOKEN=your_system_user_access_token
META_AD_ACCOUNT_ID=act_XXXXXXXXXXXXXXX  # Format: act_ + numeric ID
META_PAGE_ID=XXXXXXXXXXXXXXX            # Facebook Page ID
```

### 1.4 Token Generation Steps
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a Business App
3. Generate System User in Business Manager
4. Assign permissions to System User
5. Generate System User Access Token
6. Assign Ad Account and Page to System User

---

## 2. API Endpoints

### 2.1 Base URL
```
https://graph.facebook.com/v18.0
```

### 2.2 Image Upload
**Endpoint**: `POST /{ad_account_id}/adimages`

**Purpose**: Upload product image to Meta for use in ad creatives

**Request**:
```bash
curl -X POST \
  "https://graph.facebook.com/v18.0/act_{AD_ACCOUNT_ID}/adimages" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -F "file=@image.jpg"
```

**Response**:
```json
{
  "images": {
    "image.jpg": {
      "hash": "abc123def456",
      "url": "https://scontent.xx.fbcdn.net/..."
    }
  }
}
```

**Key Fields**:
- `hash`: Required for ad creative creation

---

### 2.3 Ad Creative Creation
**Endpoint**: `POST /{ad_account_id}/adcreatives`

**Purpose**: Create ad creative with image and copy

**Request**:
```bash
curl -X POST \
  "https://graph.facebook.com/v18.0/act_{AD_ACCOUNT_ID}/adcreatives" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "name": "Product Launch Creative",
    "object_story_spec": {
      "page_id": "{PAGE_ID}",
      "link_data": {
        "image_hash": "{IMAGE_HASH}",
        "link": "https://example.com/product",
        "message": "Discover our latest product",
        "name": "Product Headline",
        "description": "Product description",
        "call_to_action": {
          "type": "SHOP_NOW",
          "value": {
            "link": "https://example.com/product"
          }
        }
      }
    },
    "degrees_of_freedom_spec": {
      "creative_features_spec": {
        "standard_enhancements": {
          "enroll_status": "OPT_IN"
        }
      }
    }
  }'
```

**Response**:
```json
{
  "id": "1234567890"
}
```

**Key Fields**:
- `id`: Creative ID (required for ad creation)

---

### 2.4 Campaign Creation
**Endpoint**: `POST /{ad_account_id}/campaigns`

**Purpose**: Create new ad campaign

**Request**:
```bash
curl -X POST \
  "https://graph.facebook.com/v18.0/act_{AD_ACCOUNT_ID}/campaigns" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "name": "Product Campaign",
    "objective": "OUTCOME_SALES",
    "status": "PAUSED",
    "special_ad_categories": [],
    "bid_strategy": "LOWEST_COST_WITHOUT_CAP"
  }'
```

**Response**:
```json
{
  "id": "2345678901"
}
```

**Campaign Objectives**:
- `OUTCOME_SALES`: Sales objective (recommended for e-commerce)
- `OUTCOME_LEADS`: Lead generation
- `OUTCOME_ENGAGEMENT`: Engagement
- `OUTCOME_AWARENESS`: Brand awareness
- `OUTCOME_TRAFFIC`: Website traffic
- `OUTCOME_APP_PROMOTION`: App promotion

**Status Values**:
- `PAUSED`: Campaign is paused (recommended for initial creation)
- `ACTIVE`: Campaign is active

---

### 2.5 Ad Set Creation
**Endpoint**: `POST /{ad_account_id}/adsets`

**Purpose**: Create ad set with targeting and budget

**Request**:
```bash
curl -X POST \
  "https://graph.facebook.com/v18.0/act_{AD_ACCOUNT_ID}/adsets" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "name": "Colombia Targeting",
    "campaign_id": "{CAMPAIGN_ID}",
    "daily_budget": 5000000,
    "billing_event": "IMPRESSIONS",
    "optimization_goal": "OFFSITE_CONVERSIONS",
    "status": "PAUSED",
    "targeting": {
      "geo_locations": {
        "countries": ["CO"],
        "location_types": ["home", "recent"]
      },
      "publisher_platforms": ["facebook", "instagram"],
      "facebook_positions": ["feed", "instant_article", "marketplace", "story", "reels"],
      "instagram_positions": ["stream", "story", "explore", "reels"]
    },
    "promoted_object": {
      "page_id": "{PAGE_ID}"
    }
  }'
```

**Response**:
```json
{
  "id": "3456789012"
}
```

**Budget Notes**:
- Budget is in cents (e.g., 5000000 = $50,000 COP)
- Minimum daily budget varies by country and currency

**Targeting Parameters**:
- `countries`: ISO 3166-1 alpha-2 country codes (e.g., "CO" for Colombia)
- `location_types`: "home", "recent", "all"
- `publisher_platforms`: "facebook", "instagram", "audience_network", "messenger"
- `facebook_positions`: Placement positions on Facebook
- `instagram_positions`: Placement positions on Instagram

---

### 2.6 Ad Creation
**Endpoint**: `POST /{ad_account_id}/ads`

**Purpose**: Create ad with creative

**Request**:
```bash
curl -X POST \
  "https://graph.facebook.com/v18.0/act_{AD_ACCOUNT_ID}/ads" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "name": "Product Ad",
    "adset_id": "{AD_SET_ID}",
    "creative": {
      "creative_id": "{CREATIVE_ID}"
    },
    "status": "PAUSED"
  }'
```

**Response**:
```json
{
  "id": "4567890123"
}
```

---

### 2.7 Ad Status Check
**Endpoint**: `GET /{ad_id}`

**Purpose**: Get current ad status

**Request**:
```bash
curl -X GET \
  "https://graph.facebook.com/v18.0/{AD_ID}?fields=id,name,status,effective_status,created_time,updated_time&access_token={ACCESS_TOKEN}"
```

**Response**:
```json
{
  "id": "4567890123",
  "name": "Product Ad",
  "status": "PAUSED",
  "effective_status": "PAUSED",
  "created_time": "2024-01-01T00:00:00+0000",
  "updated_time": "2024-01-01T00:00:00+0000"
}
```

**Status Values**:
- `PAUSED`: Ad is paused
- `ACTIVE`: Ad is active
- `DELETED`: Ad is deleted
- `ARCHIVED`: Ad is archived

**Effective Status Values**:
- `PAUSED`: Ad is paused
- `ACTIVE`: Ad is active and running
- `CAMPAIGN_PAUSED`: Campaign is paused
- `CAMPAIGN_DELETED`: Campaign is deleted
- `ADSET_PAUSED`: Ad set is paused
- `ADSET_DELETED`: Ad set is deleted
- `PENDING_REVIEW`: Ad is pending review
- `DISAPPROVED`: Ad was disapproved
- `PREAPPROVED`: Ad is pre-approved
- `PENDING_BILLING_INFO`: Pending billing info
- `CAMPAIGN_PAUSED`: Campaign is paused
- `CAMPAIGN_DELETED`: Campaign is deleted
- `CAMPAIGN_ARCHIVED`: Campaign is archived
- `ADSET_PAUSED`: Ad set is paused
- `ADSET_DELETED`: Ad set is deleted
- `ADSET_ARCHIVED`: Ad set is archived

---

### 2.8 Ad Activation/Deactivation
**Endpoint**: `POST /{ad_id}`

**Purpose**: Activate or pause an ad

**Activate Request**:
```bash
curl -X POST \
  "https://graph.facebook.com/v18.0/{AD_ID}" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{"status": "ACTIVE"}'
```

**Pause Request**:
```bash
curl -X POST \
  "https://graph.facebook.com/v18.0/{AD_ID}" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{"status": "PAUSED"}'
```

**Response**:
```json
{
  "success": true
}
```

---

## 3. Image Specifications

### 3.1 Supported Formats
| Format | Supported |
|--------|-----------|
| JPEG | ✅ Yes |
| PNG | ✅ Yes |
| GIF | ✅ Yes (static only) |
| BMP | ✅ Yes |
| TIFF | ✅ Yes |
| WebP | ✅ Yes |

### 3.2 Recommended Dimensions
| Placement | Recommended Size | Aspect Ratio |
|-----------|------------------|--------------|
| Facebook Feed | 1200 x 628 px | 1.91:1 |
| Instagram Feed | 1080 x 1080 px | 1:1 |
| Instagram Stories | 1080 x 1920 px | 9:16 |
| Facebook Stories | 1080 x 1920 px | 9:16 |
| Facebook Right Column | 1200 x 628 px | 1.91:1 |
| Facebook Marketplace | 1200 x 628 px | 1.91:1 |
| Instagram Explore | 1080 x 1080 px | 1:1 |
| Facebook In-Stream Video | 1200 x 628 px | 1.91:1 |
| Facebook Instant Articles | 1200 x 628 px | 1.91:1 |
| Messenger Inbox | 1200 x 628 px | 1.91:1 |

### 3.3 File Size Limits
- **Maximum File Size**: 8 MB
- **Minimum File Size**: 1 KB (recommended at least 100 KB for quality)

### 3.4 Image Quality Recommendations
- Use high-quality images (minimum 72 DPI)
- Avoid excessive text on images (text should cover less than 20% of image)
- Use clear, well-lit product images
- Ensure product is clearly visible
- Avoid blurry or pixelated images

### 3.5 Text Overlay Guidelines
- **Recommended**: Less than 20% text coverage
- **Maximum**: 25% text coverage (may reduce reach)
- **Text Ratio Tool**: Use Meta's Text Overlay Tool to check compliance

---

## 4. Complete Ad Creation Flow

### 4.1 Flow Diagram
```
Product Data + AI Content
          │
          ▼
┌─────────────────────┐
│ 1. Upload Image     │
│ POST /adimages      │
│ Returns: image_hash │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. Create Creative  │
│ POST /adcreatives   │
│ Returns: creative_id│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. Create Campaign  │
│ POST /campaigns     │
│ Returns: campaign_id│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. Create Ad Set    │
│ POST /adsets        │
│ Returns: ad_set_id  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 5. Create Ad        │
│ POST /ads           │
│ Returns: ad_id      │
└─────────────────────┘
```

### 4.2 Python Implementation Example
```python
from services.meta_ads_service import MetaAdsService

# Initialize service
service = MetaAdsService()

# Create complete ad
result = service.create_complete_ad(
    product={
        "productName": "Smartphone XYZ",
        "image_url": "https://example.com/smartphone.jpg",
        "description": "Última generación con cámara 108MP"
    },
    ad_content={
        "headline": "¡Smartphone XYZ en Oferta!",
        "primary_text": "No te pierdas esta increíble oferta...",
        "description": "Smartphone de última generación",
        "cta": "SHOP_NOW"
    },
    daily_budget_cop=50000
)

print(f"Campaign ID: {result['campaign_id']}")
print(f"Ad Set ID: {result['ad_set_id']}")
print(f"Ad ID: {result['ad_id']}")
print(f"Creative ID: {result['creative_id']}")
```

---

## 5. Error Handling

### 5.1 Common Error Codes
| Code | Description | Solution |
|------|-------------|----------|
| 1 | Unknown error | Retry with exponential backoff |
| 2 | Temporary issue | Retry with exponential backoff |
| 4 | Application-level throttling | Reduce request rate |
| 17 | User-level throttling | Reduce request rate |
| 32 | Page-level throttling | Reduce request rate |
| 613 | Calls to this API have exceeded the rate limit | Reduce request rate |

### 5.2 Rate Limiting
- **User-level limit**: 100 calls per hour per user
- **Ad account-level limit**: Varies by account age and spend
- **Page-level limit**: Varies by page size and activity

### 5.3 Retry Strategy
- **Max Retries**: 3
- **Backoff**: Exponential (5s, 10s, 20s)
- **Retryable Errors**: 17, 32, 613

---

## 6. Environment Variables Summary

### 6.1 Required Variables
```env
# Meta Marketing API
META_ACCESS_TOKEN=your_system_user_access_token
META_AD_ACCOUNT_ID=act_XXXXXXXXXXXXXXX
META_PAGE_ID=XXXXXXXXXXXXXXX
```

### 6.2 Optional Variables
```env
# Meta API Version (default: v18.0)
META_API_VERSION=v18.0

# Meta API Base URL (default: https://graph.facebook.com)
META_API_BASE_URL=https://graph.facebook.com
```

---

## 7. Testing

### 7.1 Unit Tests
- `test_meta_ads_service.py`: Tests for individual service methods
- `test_meta_ads_integration.py`: Tests for complete ad creation flow

### 7.2 Test Coverage
- Image upload
- Ad creative creation
- Campaign creation
- Ad set creation
- Ad creation
- Complete ad flow
- Error handling
- Rate limit retry logic

### 7.3 Running Tests
```bash
# Run all tests
python -m pytest tests/ -v

# Run specific test file
python -m pytest test_meta_ads_service.py -v

# Run with coverage
python -m pytest --cov=services --cov-report=html
```

---

## 8. References

### 8.1 Official Documentation
- [Meta Marketing API Documentation](https://developers.facebook.com/docs/marketing-apis)
- [Ad Creative Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-creative)
- [Campaign Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign)
- [Ad Set Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-set)
- [Ad Reference](https://developers.facebook.com/docs/marketing-api/reference/ad)
- [Image Specifications](https://developers.facebook.com/docs/marketing-api/images)

### 8.2 Tools
- [Meta Business Suite](https://business.facebook.com/)
- [Meta Ads Manager](https://www.facebook.com/adsmanager/)
- [Meta for Developers](https://developers.facebook.com/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

---

## 9. Changelog

### Version 1.0 (2024-01-01)
- Initial specification
- Meta Marketing API v18.0 support
- Image ad creation flow
- Colombia targeting configuration
- AI ad content integration
