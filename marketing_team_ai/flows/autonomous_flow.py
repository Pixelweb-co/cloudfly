import logging
import json

from crews.marketing_crew import build_marketing_crew
from tools.mysql_tool import MySQLTool
from services.prospector_service import ProspectorService

logger = logging.getLogger("cloudfly_ai")

class AutonomousMarketingFlow:

    def __init__(self):
        self.prospector_service = ProspectorService()

    def get_active_companies(self):
        conn = MySQLTool.get_connection()
        cursor = conn.cursor(dictionary=True)

        query = '''
        SELECT c.id, c.tenant_id, c.name,
               cl.business_type,
               cl.business_description,
               cl.pais_nombre
        FROM companies c
        JOIN clientes cl ON c.tenant_id = cl.id
        WHERE c.status = 1
        '''

        cursor.execute(query)
        companies = cursor.fetchall()

        cursor.close()
        conn.close()

        return companies

    def get_products(self, tenant_id, company_id):
        conn = MySQLTool.get_connection()
        cursor = conn.cursor(dictionary=True)

        query = '''
        SELECT id, product_name, description
        FROM productos
        WHERE tenant_id = %s
        AND company_id = %s
        AND status IN ('ACTIVE', 'PUBLISHED')
        '''

        cursor.execute(query, (tenant_id, company_id))
        products = cursor.fetchall()

        cursor.close()
        conn.close()

        return products

    def run(self):

        companies = self.get_active_companies()

        logger.info(f"Found {len(companies)} companies")

        for company in companies:

            logger.info(f"Processing company {company['name']}")

            products = self.get_products(
                company['tenant_id'],
                company['id']
            )

            if not products:
                continue

            crew = build_marketing_crew(
                company=company,
                products=products
            )

            result = crew.kickoff()

            logger.info(result)

            raw_output = str(result).strip()
            # Limpiar posibles bloques markdown envueltos en ```json ... ```
            if raw_output.startswith("```json"):
                raw_output = raw_output[7:]
            if raw_output.endswith("```"):
                raw_output = raw_output[:-3]
            raw_output = raw_output.strip()

            try:
                result_json = json.loads(raw_output)
                logger.info("✅ Crew output successfully parsed as JSON!")
            except Exception:
                logger.warning("Crew output is not valid JSON")
                continue

            logger.info(result_json)

