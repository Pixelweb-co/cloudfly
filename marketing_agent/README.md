# Marketing Agent - CloudFly

Microservicio autónomo para la creación y ejecución de campañas promocionales de productos activos.

## Estructura del Proyecto

```
marketing_agent/
├── Dockerfile
├── requirements.txt
├── config.py
├── main.py
├── services/
│   ├── __init__.py
│   ├── product_service.py
│   ├── campaign_service.py
│   └── evolution_service.py
└── models/
    ├── __init__.py
    └── campaign.py
```

## Configuración

Crear un archivo `.env` con las siguientes variables:

```env
BACKEND_URL=http://backend:8080
BACKEND_API_KEY=your_api_key
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=your_evolution_key
EVOLUTION_INSTANCE=cloudfly-main
DB_HOST=mysql_host
DB_PORT=3306
DB_NAME=cloud_master
DB_USER=root
DB_PASSWORD=your_db_password
TENANT_ID=1
COMPANY_ID=1
MIN_DELAY_MS=3000
MAX_DELAY_MS=12000
BATCH_SIZE=20
BATCH_PAUSE_MS=30000
```

## Ejecución Local

```bash
pip install -r requirements.txt
python main.py
```

## Ejecución con Docker

```bash
docker build -t marketing-agent .
docker run --env-file .env marketing-agent
```

## Pruebas

```bash
python -m pytest test_marketing_agent.py -v
```

## Anti-Spam

El microservicio implementa las siguientes medidas anti-spam:

- Retraso aleatorio de 3-12 segundos entre mensajes
- Pausa de 30 segundos cada 20 mensajes
- Indicador de presencia "composing" antes de enviar
- Parámetro `delay` en la API de Evolution (1200-4500ms)
