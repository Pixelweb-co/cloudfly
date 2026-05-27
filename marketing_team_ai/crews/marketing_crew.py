from crewai import Task, Crew, Process

from agents.icp_agent import icp_agent
from agents.qualification_agent import qualification_agent
from agents.copywriter_agent import copywriter_agent
from agents.researcher_agent import researcher_agent


def build_analysis_crew(company, products):
    research_task = Task(
        description=f'''
        Investiga en internet la competencia, precios y estudios de mercado del producto:
        {products}
        
        Identifica cuáles son las mayores debilidades de los competidores y qué precios manejan
        para estructurar una oferta B2B irresistible con CloudFly enfocada a maximizar las ventas
        y garantizar comisiones.
        ''',
        expected_output="Análisis de competidores y ventajas de precios",
        agent=researcher_agent
    )

    analyze_task = Task(
        description=f'''
        Analiza la empresa:

        Empresa: {company['name']}
        Tipo: {company.get('business_type')}
        Descripción: {company.get('business_description')}

        Productos:
        {products}

        Determina:
        - si es B2B
        - ICP ideales
        - Nichos comerciales
        - categorías Google Maps y buscadores enfocadas a estos productos.
        ''',
        expected_output="JSON con is_b2b y categories",
        agent=icp_agent,
        context=[research_task]
    )

    return Crew(
        agents=[researcher_agent, icp_agent],
        tasks=[research_task, analyze_task],
        process=Process.sequential,
        verbose=True
    )


def build_campaign_crew(company, products, leads):
    qualification_task = Task(
        description=f'''
        Califica los siguientes leads:

        {leads}

        usando los productos:

        {products}
        ''',
        expected_output="Lista JSON de leads calificados",
        agent=qualification_agent
    )

    copywriting_task = Task(
        description='''
        Genera un mensaje altamente persuasivo de WhatsApp para conseguir ventas.
        Debe incluir emojis, CTA, enfoque B2B y resaltar las ventajas competitivas
        de precio y automatización encontradas.

        IMPORTANTE: Para evitar errores de formateo, debes responder estrictamente con un objeto JSON en el siguiente formato:
        {
          "message": "Mensaje final de WhatsApp con emojis aquí"
        }
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
    return build_analysis_crew(company, products)

