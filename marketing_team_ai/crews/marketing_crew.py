from crewai import Task, Crew, Process

from agents.icp_agent import icp_agent, create_icp_agent
from agents.qualification_agent import qualification_agent
from agents.copywriter_agent import copywriter_agent
from agents.researcher_agent import researcher_agent


def build_analysis_crew(company, product):
    research_task = Task(
        description=f'''
        Investiga en internet la competencia, precios y estudios de mercado del producto:
        Nombre: {product.get('product_name')}
        Descripción: {product.get('description')}
        
        Identifica cuáles son las mayores debilidades de los competidores y qué precios manejan
        para estructurar una oferta B2B irresistible enfocada al 100% en maximizar las ventas
        de este producto específico.

        Además, analiza las necesidades del mercado relacionadas con este producto y
        detecta oportunidades de negocio concretas (problemas no resueltos, segmentos con alta demanda,
        casos de uso locales) donde el producto puede servir y generar valor. Devuelve ejemplos accionables.
        ''',
        expected_output="Análisis de competidores y ventajas de precios",
        agent=researcher_agent
    )

    analyze_task = Task(
        description=f'''
        Analiza detalladamente las oportunidades de mercado de este producto específico y no de la empresa en general:
        Producto: {product.get('product_name')}
        Descripción: {product.get('description')}

        Determina:
        1. Si es un modelo B2B (los compradores ideales son dueños de negocios locales o empresas).
        2. Los ICP ideales que se beneficien directamente de este producto puntual.
           Si el producto es un Chatbot, el foco absoluto debe estar en sectores locales de servicios y comercio que agenden citas o hagan pedidos:
           - peluquerias, barberias, clinicas estetica, veterinarias, spas (agendamiento de citas)
           - restaurantes, panaderias, reposterias, tiendas locales (pedidos y ventas)
        3. Una lista de hasta 8 categorías de búsqueda de Google Maps y buscadores en español muy específicas para encontrar estos clientes potenciales para este producto.
                4. Además, describe hasta 5 oportunidades de negocio concretas y necesidades detectadas (por ejemplo: "pequeñas clínicas sin sitio web que usan WhatsApp para agendar citas", "restaurantes sin sistema de pedidos online") que justifiquen la prospección y cómo el producto los soluciona.

                IMPORTANTE: Responde estrictamente con un objeto JSON con la siguiente forma:
                {{
                    "is_b2b": true|false,
                    "categories": ["categoria1", ...],
                    "opportunities": ["oportunidad1", ...]
                }}
        ''',
                expected_output="JSON con is_b2b, categories y opportunities",
        agent=create_icp_agent(product.get('product_name'), product.get('description')),
        context=[research_task]
    )

    return Crew(
        agents=[researcher_agent, icp_agent],
        tasks=[research_task, analyze_task],
        process=Process.sequential,
        verbose=True
    )


def build_campaign_crew(company, product, leads):
    qualification_task = Task(
        description=f'''
        Califica a los dueños de negocio (leads) obtenidos para ver si son compradores perfectos para el producto específico:
        Nombre: {product.get('product_name')}
        Descripción: {product.get('description')}

        Leads a evaluar:
        {leads}
        ''',
        expected_output="Lista JSON de leads calificados",
        agent=qualification_agent
    )

    copywriting_task = Task(
        description=f'''
        Genera un mensaje altamente persuasivo de WhatsApp enfocado al 100% en vender el producto específico de forma directa y no en la compañía:
        Nombre: {product.get('product_name')}
        Descripción: {product.get('description')}

        El mensaje debe ser directo, amigable, usar emojis, CTA claro y resaltar las ventajas competitivas (como agendar citas de servicios o hacer pedidos automáticos) de este producto de forma puntual.

        IMPORTANTE: Para evitar errores de formateo, debes responder estrictamente con un objeto JSON en el siguiente formato:
        {{
          "message": "Mensaje final de WhatsApp con emojis aquí"
        }}
        ''',
        expected_output="Un objeto JSON válido con la propiedad 'message'",
        agent=copywriter_agent,
        context=[qualification_task]
    )

    return Crew(
        agents=[qualification_agent, copywriter_agent],
        tasks=[qualification_task, copywriting_task],
        process=Process.sequential,
        verbose=True
    )


def build_marketing_crew(company, products, leads=None):
    # Legacy fallback function just in case
    product = products[0] if isinstance(products, list) and products else products
    return build_analysis_crew(company, product)

