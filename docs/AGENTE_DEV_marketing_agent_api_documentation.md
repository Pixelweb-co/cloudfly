# Marketing Agent API Documentation

## Overview
The Marketing Agent is a **CLI‑driven** Python microservice. It does not expose a public HTTP API, but it interacts with several internal services:

| Service | Base URL | Purpose |
|---------|----------|---------|
| Backend API | `http://backend:8080` | Product catalog, authentication |
| Evolution API | `http://evolution-api:8080` | WhatsApp message delivery |
| Meta Marketing API | `https://graph.facebook.com/v18.0` | Create campaigns, ad sets, ads |

## Internal Python Service Interfaces

### `services.product_service.ProductService.get_active_product_with_image(tenant_id: int) -> dict`
- Calls **Backend API** `GET /products/active?tenant_id={tenant_id}`
- Returns a JSON object with fields `productName`, `image_url`, `description`, `price`.

### `services.ai_ad_service.AIAdService.generate_ad(product: dict) -> dict`
- Calls **OpenRouter** `/v1/chat/completions` with a prompt built from the product data.
- Returns a dictionary containing `{headline, primary_text, description, cta}`.

### `services.meta_ads_service.MetaAdsService.create_complete_ad(product: dict, ad_content: dict, daily_budget_cop: int) -> dict`
- Executes the full Meta Ads flow (image upload → creative → campaign → ad set → ad) as described in `META_API_SPECIFICATION.md`.
- Returns IDs of the created objects: `{campaign_id, ad_set_id, ad_id, creative_id, image_hash}`.

### `services.evolution_service.EvolutionService.send_campaign(phone: str, message: str) -> bool`
- Calls **Evolution API** `POST /whatsapp/send` with the generated message.
- Returns `True` on success.

## CLI Commands

| Command | Description |
|---------|-------------|
| `python main.py --generate-ad` | Generates AI ad copy for the active product and prints it. |
| `python main.py --create-meta-ads` | Creates a full Meta Ads campaign (paused) using the generated ad content. |
| `python main.py --generate-ad --create-meta-ads` | Runs both generation and Meta Ads creation sequentially. |
| `python main.py --create-meta-ads --meta-ads-budget 100000` | Sets the daily budget (in COP) for the Meta Ads campaign. |

All commands rely on environment variables defined in `.env.example` and loaded via `marketing_agent/config.py`.
