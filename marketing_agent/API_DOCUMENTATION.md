# Marketing Agent – API Documentation

## Meta Marketing API Integration

This document provides the complete API reference for Meta Ads integration used by the Marketing Agent.

### Base URL
```
https://graph.facebook.com/v18.0
```

### Authentication
All requests require an OAuth 2.0 Bearer token in the header:
```
Authorization: Bearer {META_ACCESS_TOKEN}
```

---

## 1. Upload Ad Image

**Endpoint**: `POST /{ad_account_id}/adimages`  
**Purpose**: Upload a product image to Meta for use in ad creatives.

| Header | Value | Required |
|--------|-------|----------|
| Authorization | Bearer {token} | Yes |
| Content-Type | multipart/form-data | Yes |

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| file | binary | Image file (JPEG/PNG/WebP) | Yes |

**Response Schema**
```
{
  "images": {
    "filename.jpg": {
      "hash": "string",
      "url": "string"
    }
  }
}
```

**Error Responses**

| Code | Message | Solution |
|------|---------|----------|
| 100 | Invalid file format | Use JPEG/PNG/WebP |
| 324 | Image too large | Reduce to < 8 MB |

---

## 2. Create Ad Creative

**Endpoint**: `POST /{ad_account_id}/adcreatives`  
**Purpose**: Create a new ad creative using the uploaded image hash.

| Header | Value | Required |
|--------|-------|----------|
| Authorization | Bearer {token} | Yes |
| Content-Type | application/json | Yes |

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| name | string | Creative name | Yes |
| object_story_spec | object | Ad story spec (image_hash, link, etc.) | Yes |

**Response Schema**
```
{
  "id": "string",
  "name": "string",
  "object_story_spec": { ... }
}
```

**Error Responses**

| Code | Message | Solution |
|------|---------|----------|
| 200 | Invalid JSON | Validate schema |
| 300 | Image hash not found | Verify image upload |

---

## 3. Create Campaign

**Endpoint**: `POST /{ad_account_id}/campaigns`  
**Purpose**: Create a new campaign.

| Header | Value | Required |
|--------|-------|----------|
| Authorization | Bearer {token} | Yes |
| Content-Type | application/json | Yes |

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| name | string | Campaign name | Yes |
| objective | string | Campaign objective (e.g., "LINK_CLICKS") | Yes |
| status | string | Campaign status (e.g., "PAUSED") | Yes |

**Response Schema**
```
{
  "id": "string",
  "name": "string",
  "objective": "string",
  "status": "string"
}
```

**Error Responses**

| Code | Message | Solution |
|------|---------|----------|
| 400 | Invalid objective | Check objective list |
| 401 | Unauthorized | Refresh token |

---

## 4. Create Ad Set

**Endpoint**: `POST /{ad_account_id}/adsets`  
**Purpose**: Create a new ad set under a campaign.

| Header | Value | Required |
|--------|-------|----------|
| Authorization | Bearer {token} | Yes |
| Content-Type | application/json | Yes |

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| name | string | Ad set name | Yes |
| campaign_id | string | Parent campaign ID | Yes |
| daily_budget | integer | Daily budget in cents | Yes |
| billing_event | string | Billing event (e.g., "IMPRESSIONS") | Yes |
| optimization_goal | string | Optimization goal (e.g., "REACH") | Yes |
| start_time | string | ISO 8601 start time | Yes |
| end_time | string | ISO 8601 end time | Yes |

**Response Schema**
```
{
  "id": "string",
  "name": "string",
  "campaign_id": "string",
  "daily_budget": "integer"
}
```

**Error Responses**

| Code | Message | Solution |
|------|---------|----------|
| 400 | Invalid budget | Ensure budget > 0 |
| 404 | Campaign not found | Verify campaign ID |

---

## 5. Create Ad

**Endpoint**: `POST /{ad_account_id}/ads`  
**Purpose**: Create a new ad under an ad set.

| Header | Value | Required |
|--------|-------|----------|
| Authorization | Bearer {token} | Yes |
| Content-Type | application/json | Yes |

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| name | string | Ad name | Yes |
| adset_id | string | Parent ad set ID | Yes |
| creative | object | Creative object (id) | Yes |
| status | string | Ad status (e.g., "PAUSED") | Yes |

**Response Schema**
```
{
  "id": "string",
  "name": "string",
  "adset_id": "string",
  "status": "string"
}
```

**Error Responses**

| Code | Message | Solution |
|------|---------|----------|
| 400 | Invalid creative | Verify creative ID |
| 401 | Unauthorized | Refresh token |

---

## 6. Ad Status Check & Activation/Deactivation

**Endpoint**: `GET /{ad_id}`  
**Purpose**: Retrieve ad status.

**Endpoint**: `POST /{ad_id}`  
**Purpose**: Update ad status (e.g., activate/deactivate).

| Header | Value | Required |
|--------|-------|----------|
| Authorization | Bearer {token} | Yes |
| Content-Type | application/json | Yes |

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| status | string | New status (e.g., "ACTIVE" or "PAUSED") | Yes |

**Response Schema**
```
{
  "id": "string",
  "status": "string"
}
```

**Error Responses**

| Code | Message | Solution |
|------|---------|----------|
| 404 | Ad not found | Verify ad ID |
| 429 | Rate limit | Back‑off |

---

## 3. Command Line Interface

### Available Flags

| Flag | Description | Default | Example |
|------|-------------|---------|---------|
| `--generate-ad` | Generate AI ad copy | False | `--generate-ad` |
| `--create-meta-ads` | Create Meta image ads | False | `--create-meta-ads` |
| `--meta-ads-budget` | Daily budget in COP | 50000 | `--meta-ads-budget 100000` |

### Usage Examples

```bash
# Generate AI ad copy only
python main.py --generate-ad

# Create Meta image ad with default budget
python main.py --create-meta-ads

# Full campaign with custom budget
python main.py --generate-ad --create-meta-ads --meta-ads-budget 100000
```

---

## 4. Configuration Reference

### Required Environment Variables

| Variable | Description | Format | Example |
|----------|-------------|--------|---------|
| META_ACCESS_TOKEN | System User OAuth token | String | EAABsbCS1iHgBO... |
| META_AD_ACCOUNT_ID | Ad Account identifier | act_XXXXXXXXXXXXXXX | act_123456789 |
| META_PAGE_ID | Facebook Page identifier | Numeric string | 123456789012345 |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| META_API_VERSION | API version | v18.0 |
| META_API_BASE_URL | API base URL | https://graph.facebook.com |

---

## 5. Error Handling Reference

| Error Code | Description | Retry Strategy | Troubleshooting |
|------------|-------------|----------------|----------------|
| 100 | Invalid file format | 3× exponential back‑off | Verify MIME type |
| 324 | Image too large | 3× exponential back‑off | Compress image |
| 200 | Invalid JSON | 3× exponential back‑off | Validate payload |
| 300 | Image hash not found | 3× exponential back‑off | Re‑upload image |
| 401 | Unauthorized | Refresh token | Check `META_ACCESS_TOKEN` |
| 429 | Rate limit exceeded | Exponential back‑off, respect `Retry-After` header | Reduce request frequency |

---

## 6. Sample cURL & Python Snippets

*(Provide concise examples for each endpoint, demonstrating headers, body, and handling of responses.)*

---

## 7. Glossary

*(Optional – define terms like Ad Creative, Campaign, Ad Set, etc.)*

---

## 8. References

- Meta Marketing API Docs: https://developers.facebook.com/docs/marketing-api
- `marketing_agent/META_API_SPECIFICATION.md` – Technical spec
- `marketing_agent/config.py` – Environment variables
- `marketing_agent/main.py` – CLI implementation

---

**End of Documentation**
