from crewai import Task, Crew, Process

from agents.icp_agent import icp_agent
from agents.qualification_agent import qualification_agent
from agents.copywriter_agent import copywriter_agent


def build_marketing_crew(company, products, leads=None):

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
        - categorías Google Maps y buscadores, directorios, googgle etc. enfocadas a productos y servicios donde necesitan posicionarse, ventas por internet, agendamiendo de citas de servicios, etc. 
        ''',
        expected_output="JSON con is_b2b y categories",
        agent=icp_agent
    )

    qualification_task = Task(
        description=f'''
        Califica los siguientes leads:

        {leads}

        usando los productos:

        {products}
        ''',
        expected_output="Lista JSON de leads calificados",
        agent=qualification_agent,
        context=[analyze_task]
    )

    copywriting_task = Task(
        description='''
        Genera un mensaje persuasivo de WhatsApp.
        Debe incluir:
        - emojis
        - CTA
        - tono profesional
        - enfoque B2B
        ''',
        expected_output="Mensaje listo para WhatsApp",
        agent=copywriter_agent,
        context=[qualification_task]
    )

    return Crew(
        agents=[
            icp_agent,
            qualification_agent,
            copywriter_agent
        ],
        tasks=[
            analyze_task,
            qualification_task,
            copywriting_task
        ],
        process=Process.sequential,
        verbose=True
    )
