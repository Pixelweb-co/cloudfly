import json
import logging

logger = logging.getLogger(__name__)

class ToolRegistry:
    ALL_DEFINITIONS = {
        "search_products_semantically": {
            "type": "function",
            "function": {
                "name": "search_products_semantically",
                "description": "Busca productos por nombre o descripción.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": { "type": "string", "description": "Término de búsqueda o descripción del producto." }
                    },
                    "required": ["query"]
                }
            }
        },
        "check_products_stock": {
            "type": "function",
            "function": {
                "name": "check_products_stock",
                "description": "Consulta inventario de productos por ID.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "product_ids": {
                            "type": "array",
                            "items": { "type": "integer" },
                            "description": "Lista de IDs de productos a consultar."
                        }
                    },
                    "required": ["product_ids"]
                }
            }
        },
        "get_contact": {
            "type": "function",
            "function": {
                "name": "get_contact",
                "description": "Busca contacto por email o teléfono.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "identifier": { "type": "string", "description": "Teléfono o email del contacto." }
                    },
                    "required": ["identifier"]
                }
            }
        },
        "manage_contact": {
            "type": "function",
            "function": {
                "name": "manage_contact",
                "description": "Crea o actualiza datos de un contacto.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "action": { "type": "string", "enum": ["create", "update"] },
                        "name": { "type": "string" },
                        "email": { "type": "string" },
                        "phone": { "type": "string" },
                        "address": { "type": "string" },
                        "tax_id": { "type": "string", "description": "NIT o Identificación Tributaria" },
                        "document_type": { "type": "string", "enum": ["CC", "NIT", "TI", "PASAPORTE"] },
                        "document_number": { "type": "string" },
                        "contact_id": { "type": "integer", "description": "ID del contacto (requerido para update)" }
                    },
                    "required": ["action"]
                }
            }
        },
        "update_pipeline_stage": {
            "type": "function",
            "function": {
                "name": "update_pipeline_stage",
                "description": "Mueve el contacto a otra etapa del pipeline.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "contact_id": { "type": "integer" },
                        "stage_id": { "type": "integer" }
                    },
                    "required": ["contact_id", "stage_id"]
                }
            }
        },
        "generate_pipeline_chart": {
            "type": "function",
            "function": {
                "name": "generate_pipeline_chart",
                "description": "Genera gráfico de contactos por etapa.",
                "parameters": {
                    "type": "object",
                    "properties": {}
                }
            }
        },
        "create_order": {
            "type": "function",
            "function": {
                "name": "create_order",
                "description": "Crea un pedido cuando el cliente confirma compra.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "customer_id": { "type": "integer" },
                        "notes": { "type": "string" },
                        "items": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "productId": { "type": "integer" },
                                    "productName": { "type": "string" },
                                    "quantity": { "type": "integer" },
                                    "unitPrice": { "type": "number" }
                                },
                                "required": ["productId", "productName", "quantity", "unitPrice"]
                            }
                        }
                    },
                    "required": ["customer_id", "items"]
                }
            }
        },
        "create_quote": {
            "type": "function",
            "function": {
                "name": "create_quote",
                "description": "Crea cotización cuando el cliente pide presupuesto.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "customer_id": { "type": "integer" },
                        "notes": { "type": "string" },
                        "items": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "productId": { "type": "integer" },
                                    "productName": { "type": "string" },
                                    "quantity": { "type": "integer" },
                                    "unitPrice": { "type": "number" }
                                },
                                "required": ["productId", "productName", "quantity", "unitPrice"]
                            }
                        }
                    },
                    "required": ["customer_id", "items"]
                }
            }
        },
        "convert_quote_to_order": {
            "type": "function",
            "function": {
                "name": "convert_quote_to_order",
                "description": "Convierte cotización existente en pedido oficial.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "quote_id": { "type": "integer" }
                    },
                    "required": ["quote_id"]
                }
            }
        },
        "get_order": {
            "type": "function",
            "function": {
                "name": "get_order",
                "description": "Obtiene detalle de un pedido por ID.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "order_id": { "type": "integer" }
                    },
                    "required": ["order_id"]
                }
            }
        },
        "modify_order": {
            "type": "function",
            "function": {
                "name": "modify_order",
                "description": "Modifica items o notas de un pedido existente.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "order_id": { "type": "integer" },
                        "notes": { "type": "string" },
                        "items": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "productId": { "type": "integer" },
                                    "productName": { "type": "string" },
                                    "quantity": { "type": "integer" },
                                    "unitPrice": { "type": "number" }
                                },
                                "required": ["productId", "productName", "quantity", "unitPrice"]
                            }
                        }
                    },
                    "required": ["order_id", "items"]
                }
            }
        }
    }

    def __init__(self, ai_service, tenant_id: int):
        self.ai_service = ai_service
        self.tenant_id = tenant_id

    def get_definitions(self, enabled_tools: list[str]) -> list:
        """Filtra y retorna solo las definiciones de herramientas habilitadas."""
        return [self.ALL_DEFINITIONS[name] for name in enabled_tools if name in self.ALL_DEFINITIONS]

    async def dispatch(self, function_name: str, args: dict) -> str:
        """Despacha la llamada a la herramienta correspondiente en el ai_service."""
        try:
            handlers = {
                "search_products_semantically": lambda a: self.ai_service.search_products(a.get("query"), self.tenant_id),
                "check_products_stock": lambda a: self.ai_service.check_products_stock(a.get("product_ids"), self.tenant_id),
                "get_contact": lambda a: self.ai_service.get_contact(a.get("identifier"), self.tenant_id),
                "manage_contact": lambda a: self.ai_service.manage_contact(a.get("action"), self.tenant_id, **a),
                "update_pipeline_stage": lambda a: self.ai_service.update_pipeline_stage(a.get("contact_id"), a.get("stage_id"), self.tenant_id),
                "generate_pipeline_chart": lambda a: self.ai_service.generate_pipeline_chart(self.tenant_id),
                "create_order": lambda a: self.ai_service.create_order(a.get("customer_id"), a.get("items"), self.tenant_id, notes=a.get("notes")),
                "create_quote": lambda a: self.ai_service.create_quote(a.get("customer_id"), a.get("items"), self.tenant_id, notes=a.get("notes")),
                "convert_quote_to_order": lambda a: self.ai_service.convert_quote_to_order(a.get("quote_id"), self.tenant_id),
                "get_order": lambda a: self.ai_service.get_order(a.get("order_id"), self.tenant_id),
                "modify_order": lambda a: self.ai_service.modify_order(a.get("order_id"), a.get("items"), self.tenant_id, notes=a.get("notes"))
            }
            
            handler = handlers.get(function_name)
            if handler:
                # Todas las funciones de I/O en AIService ahora son async
                return await handler(args)
            
            return json.dumps({"error": f"Tool {function_name} not found"})
        except Exception as e:
            logger.error(f"Error dispatching tool {function_name}: {e}")
            return json.dumps({"error": str(e)})
