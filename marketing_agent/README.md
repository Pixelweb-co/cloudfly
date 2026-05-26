# Marketing Agent - CloudFly

Microservicio de automatización de marketing para CloudFly que integra:
- Generación de anuncios con IA (OpenRouter/NVIDIA Nemotron)
- Envío de campañas por WhatsApp (Evolution API)
- Creación de anuncios en Meta (Facebook/Instagram)

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                      Marketing Agent                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  AI Ad      │  │  Product    │  │  Campaign   │            │
│  │  Service    │  │  Service    │  │  Service    │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│                   ┌──────┴──────┐                               │
│                   │  Marketing  │                               │
│                   │  Agent      │                               │
│                   └──────┬──────┘                               │
│                          │                                      │
│         ┌────────────────┼────────────────┐                     │
│         │                │                │                     │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐            │
│  │  Evolution  │  │  Meta Ads   │  │  Database   │            │
│  │  Service    │  │  Service    │  │  Service    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Servicios

### AIAdService
Genera contenido publicitario usando OpenRouter API con el modelo NVIDIA Nemotron.

```python
from services.ai_ad_service import AIAdService

service = AIAdService()
ad_content = service.generate_ad({
    "productName": "Smartphone XYZ",
    "description": "Última generación",
    "price": 1500000
})
# Returns: {headline, primary_text, description, cta}
```

### ProductService
Obtiene productos activos con imágenes del backend de CloudFly.

```python
from services.product_service import ProductService

service = ProductService()
product = service.get_active_product_with_image(tenant_id=1)
```

### CampaignService
Construye mensajes de campaña para WhatsApp.

```python
from services.campaign_service import CampaignService

service = CampaignService()
message = service.build_campaign_message(product)
```

### EvolutionService
Envía mensajes por WhatsApp usando Evolution API.

```python
from services.evolution_service import EvolutionService

service = EvolutionService()
success = service.send_campaign(phone, message)
```

### MetaAdsService
Crea anuncios en Meta (Facebook/Instagram) usando Marketing API v18.0.

```python
from services.meta_ads_service import MetaAdsService

service = MetaAdsService()
result = service.create_complete_ad(
    product=product,
    ad_content=ad_content,
    daily_budget_cop=50000
)
# Returns: {campaign_id, ad_set_id, ad_id, creative_id, image_hash}
```

## Instalación

### Requisitos
- Python 3.11+
- pip

### Instalación de dependencias

```bash
pip install -r requirements.txt
```

### Configuración

Copiar `.env.example` a `.env` y configurar las variables:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
# Backend API
BACKEND_URL=http://backend:8080
BACKEND_API_KEY=tu_api_key

# Evolution API (WhatsApp)
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=tu_evolution_key
EVOLUTION_INSTANCE=cloudfly-main

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cloud_master
DB_USER=root
DB_PASSWORD=tu_password

# Campaign Settings
TENANT_ID=1
COMPANY_ID=1

# OpenRouter API (para generación de anuncios con IA)
OPENROUTER_API_KEY=tu_openrouter_key

# Meta Marketing API (para anuncios en Facebook/Instagram)
META_ACCESS_TOKEN=tu_meta_token
META_AD_ACCOUNT_ID=act_tu_account_id
META_PAGE_ID=tu_page_id
META_APP_ID=123456789012345
META_APP_SECRET=your_app_secret
META_SYSTEM_USER_ID=1234567890123456
META_API_VERSION=v18.0
META_IMAGE_MAX_SIZE_MB=8
META_IMAGE_MAX_TEXT_PERCENTAGE=20
```

## Uso

### Ejecutar campaña de WhatsApp

```bash
python main.py
```

### Generar anuncio con IA y enviar campaña

```bash
python main.py --generate-ad
```

### Crear anuncios en Meta (Facebook/Instagram)

```bash
python main.py --create-meta-ads
```

### Generar anuncio con IA y crear en Meta

```bash
python main.py --generate-ad --create-meta-ads
```

### Especificar presupuesto diario para Meta Ads

```bash
python main.py --create-meta-ads --meta-ads-budget 100000
```

## Docker

### Construir imagen

```bash
docker build -t marketing-agent .
```

### Ejecutar contenedor

```bash
docker run --env-file .env marketing-agent
```

### Docker Compose

```bash
docker-compose up -d
```

## Pruebas

### Ejecutar todas las pruebas

```bash
python -m pytest tests/ -v
```

### Ejecutar pruebas específicas

```bash
# Pruebas del servicio de Meta Ads
python -m pytest test_meta_ads_service.py -v

# Pruebas de integración de Meta Ads
python -m pytest test_meta_ads_integration.py -v

# Pruebas del servicio de IA
python -m pytest test_ai_ad_service.py -v

# Pruebas del servicio de productos
python -m pytest test_product_service.py -v
```

### Cobertura de pruebas

```bash
pip install pytest-cov
python -m pytest --cov=services --cov-report=html
```

## API de Meta Marketing

El servicio utiliza Meta Marketing API v18.0 para:

1. **Subir imágenes**: `POST /{ad_account_id}/adimages`
2. **Crear creatividades**: `POST /{ad_account_id}/adcreatives`
3. **Crear campañas**: `POST /{ad_account_id}/campaigns`
4. **Crear conjuntos de anuncios**: `POST /{ad_account_id}/adsets`
5. **Crear anuncios**: `POST /{ad_account_id}/ads`

### Flujo de creación de anuncios

```
Producto + Contenido IA
        │
        ▼
┌─────────────────┐
│  Subir imagen   │
│  a Meta         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Crear          │
│  creatividad    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Crear campaña  │
│  (PAUSED)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Crear ad set   │
│  (Colombia)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Crear anuncio  │
│  (PAUSED)       │
└─────────────────┘
```

## Configuración de Meta

### Requisitos previos

1. **Cuenta de Meta Business**: Necesitas una cuenta de Meta Business Manager
2. **Ad Account**: Una cuenta de anuncios activa
3. **Facebook Page**: Una página de Facebook vinculada
4. **Access Token**: Token de acceso con permisos de `ads_management`

### Permisos requeridos

- `ads_management`
- `pages_read_engagement`
- `business_management`

### Obtener credenciales

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Crea una app tipo "Business"
3. Genera un User Token con los permisos necesarios
4. Obtén el Ad Account ID desde Ads Manager
5. Obtén el Page ID desde tu página de Facebook

## Meta Setup Guide

### Step 1: Create Meta Developer Account
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "Get Started" and create a developer account
3. Verify your account with phone number

### Step 2: Create a Business App
1. In Meta for Developers, click "Create App"
2. Select "Business" as app type
3. Fill in app details and create

### Step 3: Get Access Token
1. Go to Business Manager → System Users
2. Create a new System User
3. Assign permissions: `ads_management`, `pages_read_engagement`, `business_management`
4. Generate Access Token with these permissions

### Step 4: Find Ad Account ID
1. Go to [Ads Manager](https://www.facebook.com/adsmanager/)
2. Click on account dropdown
3. Find your Account ID (format: `act_XXXXXXXXXXXXXXX`)

### Step 5: Find Page ID
1. Go to your Facebook Page
2. Click "About" → "Page Transparency"
3. Find Page ID at bottom of section

## Troubleshooting

### Common API Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| 17 | User-level throttling | Reduce request rate, wait before retrying |
| 32 | Page-level throttling | Reduce request rate, wait before retrying |
| 613 | Rate limit exceeded | Implement exponential backoff |

### Image Upload Issues
- **Error**: "Invalid image format"
  - **Solution**: Use JPEG, PNG, or WebP formats only
- **Error**: "Image too large"
  - **Solution**: Keep images under 8MB
- **Error**: "Image rejected"
  - **Solution**: Ensure less than 20% text coverage

### Authentication Problems
- **Error**: "Invalid OAuth token"
  - **Solution**: Token may expire, generate new System User token
- **Error**: "Insufficient permissions"
  - **Solution**: Verify `ads_management` permission is granted
- **Error**: "Ad account not found"
  - **Solution**: Check META_AD_ACCOUNT_ID format (must include 'act_' prefix)

## Image Specifications

### Recommended Dimensions
| Placement | Size | Aspect Ratio |
|-----------|------|--------------|
| Facebook Feed | 1200 x 628 px | 1.91:1 |
| Instagram Feed | 1080 x 1080 px | 1:1 |
| Instagram Stories | 1080 x 1920 px | 9:16 |

### File Requirements
- **Formats**: JPEG, PNG, WebP, BMP, TIFF
- **Max Size**: 8 MB
- **Min Size**: 1 KB (recommended 100+ KB)
- **Text Coverage**: Less than 20%

## Manejo de errores

El servicio incluye:
- **Reintentos automáticos**: Para errores de rate limit (códigos 17, 32)
- **Backoff exponencial**: Espera progresiva entre reintentos
- **Manejo de timeouts**: Reintentos en caso de timeout
- **Validación de configuración**: Verifica credenciales al inicio

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| META_APP_ID | ID de la aplicación de Meta creada en el paso 2 | 123456789012345 |
| META_APP_SECRET | Secreto de la aplicación de Meta | a1b2c3d4e5f6g7h8i9j0 |
| META_SYSTEM_USER_ID | ID del System User creado en el paso 3 | 1234567890123456 |
| META_ACCESS_TOKEN | Token de acceso de larga duración con permisos requeridos | EAAGm0PX4ZC... |
| META_AD_ACCOUNT_ID | ID de la cuenta de anuncios (incluye prefijo `act_`) | act_123456789012345 |
| META_PAGE_ID | ID de la página de Facebook vinculada | 112233445566778 |
| META_API_VERSION | Versión de la Graph API a usar | v18.0 |
| META_IMAGE_MAX_SIZE_MB | Tamaño máximo permitido para imágenes (MB) | 8 |
| META_IMAGE_MAX_TEXT_PERCENTAGE | Porcentaje máximo de texto en la imagen | 20 |

## Contribución

1. Crea una rama para tu feature
2. Escribe pruebas para nueva funcionalidad
3. Asegúrate de que todas las pruebas pasen
4. Envía un pull request

## Licencia

Propiedad de CloudFly. Todos los derechos reservados.
