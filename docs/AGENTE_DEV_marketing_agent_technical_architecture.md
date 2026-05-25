# 🤖 Marketing Agent Microservice - Technical Architecture Documentation

## Executive Summary

The **Marketing Agent Microservice** (`marketing_agent/`) is a Python-based autonomous worker that integrates with the CloudFly ecosystem to fetch active products with images, build marketing campaign messages, and deliver them via WhatsApp using the Evolution API. It follows the same architectural patterns as the existing `ai-agent` (Python) and `marketing-worker` (Java) services.

---

## 1. System Architecture

### 1.1 High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "CloudFly Ecosystem"
        subgraph "Data Sources"
            BackendAPI["Backend API<br/>(Spring Boot)<br/>GET /productos/tenant/{tenantId}"]
            MySQL[(MySQL Database<br/>cloud_master<br/>contacts table)]
        end
        
        subgraph "Marketing Agent"
            MainOrchestrator["main.py<br/>Orchestrator"]
            ProductService["services/product_service.py<br/>Product API Consumer"]
            CampaignService["services/campaign_service.py<br/>Campaign Builder"]
            EvolutionService["services/evolution_service.py<br/>Evolution API Integration"]
            Config["config.py<br/>Environment Config"]
            CampaignModel["models/campaign.py<br/>CampaignMessage Dataclass"]
        end
        
        subgraph "Messaging"
            EvolutionAPI["Evolution API<br/>(WhatsApp Gateway)<br/>POST /message/sendText<br/>POST /message/sendMedia"]
            KafkaTopic["Kafka Topic<br/>campaign-worker-queue<br/>(Optional Trigger)"]
        end
    end
    
    BackendAPI -->|"HTTP GET<br/>Bearer Token"| ProductService
    MySQL -->|"mysql-connector<br/>SELECT contacts"| MainOrchestrator
    Config -->|"Environment Variables"| MainOrchestrator
    MainOrchestrator -->|"get_active_product_with_image()"| ProductService
    MainOrchestrator -->|"build_campaign_message()"| CampaignService
    CampaignService -->|"CampaignMessage"| CampaignModel
    MainOrchestrator -->|"send_campaign()"| EvolutionService
    EvolutionAPI -->|"apikey Header"| EvolutionService
    KafkaTopic -->|"JSON Message"| MainOrchestrator
    
    style MarketingAgent fill:#e1f5fe,stroke:#01579b
    style BackendAPI fill:#f3e5f5,stroke:#4a148c
    style MySQL fill:#e8f5e9,stroke:#1b5e20
    style EvolutionAPI fill:#fff3e0,stroke:#e65100
    style KafkaTopic fill:#fce4ec,stroke:#880e4f
```

### 1.2 Component Responsibilities

| Component | File | Responsibility |
|-----------|------|----------------|
| **Orchestrator** | `main.py` | Coordinates full campaign execution flow, manages contacts iteration |
| **Product Service** | `services/product_service.py` | Fetches active products with images from backend API |
| **Campaign Service** | `services/campaign_service.py` | Builds formatted WhatsApp campaign messages |
| **Evolution Service** | `services/evolution_service.py` | Sends messages via Evolution API with anti-spam |
| **Config** | `config.py` | Environment variable management (DB, APIs, anti-spam settings) |
| **Campaign Model** | `models/campaign.py` | `CampaignMessage` dataclass (text, media_url, media_type, caption) |

---

## 2. API Contracts & Integration Points

### 2.1 Product API (Backend)

```mermaid
sequenceDiagram
    participant MA as Marketing Agent
    participant BE as Backend API
    
    MA->>BE: GET /productos/tenant/{tenantId}
    Note over MA,BE: Authorization: Bearer {token}
    BE-->>MA: 200 OK - Product List
    
    alt Product Found (ACTIVE + image + description)
        MA->>MA: Extract first image URL
        MA->>MA: Return product dict with image_url
    else No Valid Product
        MA->>MA: Raise ProductNotFoundException
    end
```

**Endpoint**: `GET {BACKEND_URL}/productos/tenant/{tenantId}`

**Authentication**: Bearer token in `Authorization` header

**Response Format**:
```json
{
  "data": [
    {
      "id": 1,
      "productName": "Product Name",
      "description": "Product description...",
      "price": 100000,
      "salePrice": 90000,
      "sku": "SKU-001",
      "status": "ACTIVE",
      "imageIds": [1, 2, 3],
      "images": [
        {
          "id": 1,
          "url": "https://example.com/image.jpg",
          "altText": "Product image"
        }
      ]
    }
  ]
}
```

**Filtering Logic**:
- `status = "ACTIVE"`
- `imageIds` array must be non-empty
- `description` must not be null/empty

### 2.2 Evolution API (WhatsApp)

```mermaid
sequenceDiagram
    participant MA as Marketing Agent
    participant EA as Evolution API
    participant WA as WhatsApp User
    
    MA->>EA: POST /chat/updatePresence/{instance}
    Note over MA,EA: Body: { "number": "573001234567", "presence": "composing" }
    EA-->>MA: 200 OK
    
    MA->>MA: Random delay (1.5-3.5s)
    
    alt Media Message
        MA->>EA: POST /message/sendMedia/{instance}
        Note over MA,EA: Body: { "number": "...", "media": "url", "mediatype": "image", "caption": "...", "delay": 1500-4500 }
    else Text Message
        MA->>EA: POST /message/sendText/{instance}
        Note over MA,EA: Body: { "number": "...", "text": "...", "delay": 1200-4200 }
    end
    
    EA->>WA: Deliver Message
    EA-->>MA: 200 OK
```

**Base URL**: `{EVOLUTION_API_URL}` (e.g., `http://evolution-api:8080`)

**Authentication**: `apikey` header

**Endpoints**:

1. **Send Presence** (composing indicator):
```
POST {EVOLUTION_API_URL}/chat/updatePresence/{instanceName}
Headers: { "apikey": "{API_KEY}" }
Body: { "number": "573001234567", "presence": "composing" }
```

2. **Send Text Message**:
```
POST {EVOLUTION_API_URL}/message/sendText/{instanceName}
Headers: { "apikey": "{API_KEY}" }
Body: {
  "number": "573001234567",
  "text": "Campaign message text...",
  "delay": 1200
}
```

3. **Send Media Message**:
```
POST {EVOLUTION_API_URL}/message/sendMedia/{instanceName}
Headers: { "apikey": "{API_KEY}" }
Body: {
  "number": "573001234567",
  "media": "https://example.com/image.jpg",
  "mediatype": "image",
  "caption": "Campaign message text...",
  "delay": 1500
}
```

### 2.3 Database (MySQL)

**Connection**: Direct MySQL connection using `mysql-connector-python`

**Tables Used**:
- `contacts` - Target contacts for campaigns
- `products` - Product catalog (alternative to API)
- `channel_configs` - Evolution API instance configuration

**Contact Query**:
```sql
SELECT id, name, email, phone 
FROM contacts 
WHERE tenant_id = %s 
  AND company_id = %s 
  AND is_active = 1
```

### 2.4 Kafka (Optional Trigger)

**Topic**: `campaign-worker-queue`

**Consumer Group**: `marketing-agent-group`

**Message Format**:
```json
{
  "campaignId": 123,
  "tenantId": 456,
  "companyId": 789
}
```

---

## 3. Data Models

### 3.1 CampaignMessage Dataclass

```mermaid
classDiagram
    class CampaignMessage {
        +text: str
        +media_url: Optional[str]
        +media_type: Optional[str]
        +caption: Optional[str]
    }
    
    class Product {
        +id: int
        +productName: str
        +description: str
        +price: float
        +salePrice: float
        +sku: str
        +status: str
        +imageIds: List[int]
        +images: List[Image]
        +image_url: str (computed)
    }
    
    class Contact {
        +id: int
        +name: str
        +email: str
        +phone: str
    }
    
    Product --> CampaignMessage : "builds"
    Contact --> CampaignMessage : "receives"
```

### 3.2 Configuration Model

```mermaid
classDiagram
    class Config {
        +BACKEND_URL: str
        +BACKEND_API_KEY: str
        +EVOLUTION_API_URL: str
        +EVOLUTION_API_KEY: str
        +EVOLUTION_INSTANCE: str
        +DB_HOST: str
        +DB_PORT: int
        +DB_NAME: str
        +DB_USER: str
        +DB_PASSWORD: str
        +TENANT_ID: int
        +COMPANY_ID: int
        +MIN_DELAY_MS: int
        +MAX_DELAY_MS: int
        +BATCH_SIZE: int
        +BATCH_PAUSE_MS: int
    }
```

---

## 4. Execution Flow

### 4.1 Main Orchestrator Flow

```mermaid
flowchart TD
    Start([🚀 Marketing Agent Started]) --> FetchProduct
    
    FetchProduct[📦 Fetch Active Product] --> ProductCheck{Product Found?}
    
    ProductCheck -->|Yes| BuildMessage[📝 Build Campaign Message]
    ProductCheck -->|No| ProductError[❌ ProductNotFoundException]
    ProductError --> End([End])
    
    BuildMessage --> FetchContacts[👥 Fetch Active Contacts]
    
    FetchContacts --> ContactsCheck{Contacts Found?}
    
    ContactsCheck -->|Yes| LoopContacts[📤 Iterate Through Contacts]
    ContactsCheck -->|No| NoContacts[⚠️ No Contacts Found]
    NoContacts --> End
    
    LoopContacts --> SendMessage[Send Message via Evolution API]
    
    SendMessage --> MessageCheck{Send Success?}
    
    MessageCheck -->|Yes| IncrementSent[sent++]
    MessageCheck -->|No| IncrementFailed[failed++]
    
    IncrementSent --> MoreContacts{More Contacts?}
    IncrementFailed --> MoreContacts
    
    MoreContacts -->|Yes| AntiSpamDelay[⏳ Anti-Spam Delay]
    AntiSpamDelay --> BatchCheck{Batch Size Reached?}
    
    BatchCheck -->|Yes| BatchPause[⏸️ Batch Pause 30s]
    BatchCheck -->|No| LoopContacts
    BatchPause --> LoopContacts
    
    MoreContacts -->|No| Summary[📊 Print Summary]
    Summary --> End
```

### 4.2 Anti-Spam Strategy Flow

```mermaid
flowchart LR
    subgraph "Between Messages"
        RandomDelay["Random Delay<br/>3-12 seconds"]
    end
    
    subgraph "Every 20 Messages"
        BatchPause["Batch Pause<br/>30-45 seconds"]
    end
    
    subgraph "Per Message"
        Presence["Send Composing<br/>Presence"]
        MessageDelay["API Delay<br/>1.2-4.5 seconds"]
    end
    
    Presence --> RandomDelay
    RandomDelay --> MessageDelay
    MessageDelay --> BatchCheck{Message # mod 20 == 0?}
    BatchCheck -->|Yes| BatchPause
    BatchCheck -->|No| NextMessage
    BatchPause --> NextMessage[Next Message]
```

---

## 5. Error Handling

### 5.1 Exception Hierarchy

```mermaid
flowchart TD
    Exception --> ProductNotFoundException
    Exception --> requests.exceptions.RequestException
    Exception --> mysql.connector.Error
    
    ProductNotFoundException --> LogError[Log Error & Exit]
    requests.exceptions.RequestException --> LogError
    mysql.connector.Error --> LogError
```

### 5.2 Error Handling Strategy

| Error Type | Handling | Impact |
|------------|----------|--------|
| Product API Failure | Raise `ProductNotFoundException` | Campaign stops |
| Evolution API Failure | Log error, continue to next contact | Message skipped |
| Database Connection Error | Log error, exit | Campaign stops |
| Invalid Phone Number | Skip contact, increment failed | Contact skipped |

---

## 6. Testing Strategy

### 6.1 Unit Tests

```mermaid
flowchart TD
    subgraph "Product Service Tests"
        Test1[test_get_active_product_with_image_success]
        Test2[test_get_active_product_no_active_product]
    end
    
    subgraph "Campaign Service Tests"
        Test3[test_build_campaign_message]
    end
    
    subgraph "Evolution Service Tests"
        Test4[test_send_text_message]
        Test5[test_send_media_message]
    end
```

### 6.2 Test Coverage

| Test | Description | Status |
|------|-------------|--------|
| `test_get_active_product_with_image_success` | Verifies product filtering logic | ✅ PASS |
| `test_get_active_product_no_active_product` | Verifies exception on no valid product | ✅ PASS |
| `test_build_campaign_message` | Verifies message formatting with Colombian Peso | ✅ PASS |

---

## 7. Deployment

### 7.1 Docker Configuration

```mermaid
flowchart TD
    subgraph "Docker Build"
        BaseImage["python:3.11-slim"]
        InstallDeps["pip install -r requirements.txt"]
        CopySource["COPY . /app"]
        SetEnv["ENV variables defaults"]
        RunCmd["CMD ['python', 'main.py']"]
    end
    
    BaseImage --> InstallDeps
    InstallDeps --> CopySource
    CopySource --> SetEnv
    SetEnv --> RunCmd
```

### 7.2 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_URL` | `http://backend:8080` | Backend API URL |
| `BACKEND_API_KEY` | `` | Backend API authentication key |
| `EVOLUTION_API_URL` | `http://evolution-api:8080` | Evolution API URL |
| `EVOLUTION_API_KEY` | `` | Evolution API authentication key |
| `EVOLUTION_INSTANCE` | `cloudfly-main` | Evolution instance name |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `cloud_master` | Database name |
| `DB_USER` | `root` | Database user |
| `DB_PASSWORD` | `` | Database password |
| `TENANT_ID` | `1` | Tenant ID for multi-tenancy |
| `COMPANY_ID` | `1` | Company ID for filtering |
| `MIN_DELAY_MS` | `3000` | Minimum delay between messages (ms) |
| `MAX_DELAY_MS` | `12000` | Maximum delay between messages (ms) |
| `BATCH_SIZE` | `20` | Messages per batch |
| `BATCH_PAUSE_MS` | `30000` | Pause duration between batches (ms) |

### 7.3 Docker Compose Integration

```yaml
marketing-agent:
  build: ./marketing_agent
  env_file: .env
  restart: on-failure
  depends_on:
    - backend
    - evolution-api
  networks:
    - cloudfly-network
```

---

## 8. Directory Structure

```
marketing_agent/
├── .env.example              # Environment variable template
├── Dockerfile                # Container configuration
├── README.md                 # Project documentation
├── config.py                 # Configuration management
├── main.py                   # Main orchestrator
├── requirements.txt          # Python dependencies
├── test_marketing_agent.py   # Unit tests
├── models/
│   ├── __init__.py
│   └── campaign.py           # CampaignMessage dataclass
└── services/
    ├── __init__.py
    ├── product_service.py    # Product API consumer
    ├── campaign_service.py   # Campaign message builder
    └── evolution_service.py  # Evolution API integration
```

---

## 9. Acceptance Criteria Verification

| Criteria | Status | Verification Method |
|----------|--------|---------------------|
| Code in `marketing_agent/` directory | ✅ | File system check |
| Retrieves product with image/description | ✅ | `ProductService.get_active_product_with_image()` |
| Uses Cloudfly message agent format | ✅ | `EvolutionService` replicates exact API calls |
| Dockerfile builds without errors | ✅ | `docker build -t marketing-agent .` |
| Container runs and connects to APIs | ✅ | `docker run --env-file .env marketing-agent` |
| Anti-spam measures implemented | ✅ | Random delays, batch pauses, presence indicators |
| Unit tests pass | ✅ | 3/3 tests passing |

---

## 10. Integration with CloudFly Ecosystem

```mermaid
graph TB
    subgraph "CloudFly Platform"
        Dashboard[Next.js Dashboard]
        Backend[Spring Boot Backend]
        AIAgent[Python AI Agent]
        MarketingWorker[Java Marketing Worker]
        MarketingAgent[Python Marketing Agent]
    end
    
    subgraph "External Services"
        EvolutionAPI[Evolution API]
        WhatsApp[WhatsApp Users]
    end
    
    Dashboard --> Backend
    Backend --> AIAgent
    Backend --> MarketingWorker
    Backend --> MarketingAgent
    MarketingAgent --> EvolutionAPI
    EvolutionAPI --> WhatsApp
```

---

## 11. Future Enhancements

1. **Kafka Integration**: Subscribe to `campaign-worker-queue` for triggered campaigns
2. **LLM Integration**: Use OpenAI/OpenRouter for creative message generation
3. **Campaign Tracking**: Store campaign metrics in database
4. **Retry Mechanism**: Implement exponential backoff for failed messages
5. **Multi-Product Campaigns**: Support multiple products in single campaign
6. **Scheduling**: Add cron-based campaign scheduling
7. **A/B Testing**: Support multiple message variants

---

## 12. Troubleshooting Guide

| Issue | Cause | Solution |
|-------|-------|----------|
| `ProductNotFoundException` | No active product with image | Ensure backend has ACTIVE product with image |
| `ConnectionError` to Evolution API | API not reachable | Check `EVOLUTION_API_URL` and network |
| `mysql.connector.Error` | Database connection failed | Verify DB credentials and connectivity |
| Messages not delivered | Invalid phone number | Validate phone number format (57XXXXXXXXXX) |
| Rate limiting | Too many messages | Increase `MIN_DELAY_MS` and `BATCH_PAUSE_MS` |

---

*Documentation generated by Technical Writer Agent for CLOUD-61 Marketing Microservice*
