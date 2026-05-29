"""Resume CrewAI campaign workflow when lead_search_results arrives."""

import json
import logging
from datetime import datetime, timedelta

from crews.marketing_crew import build_campaign_crew
from services.lead_search_job_service import LeadSearchJobService
from services.prospector_service import ProspectorService

logger = logging.getLogger("marketing_team_ai.lead_pipeline")


class LeadSearchPipeline:
    def __init__(self, autonomous_flow):
        self.flow = autonomous_flow
        self.job_service = LeadSearchJobService()
        self.prospector = ProspectorService()

    def on_search_completed(self, event: dict) -> None:
        request_id = event.get("request_id")
        job_id = event.get("job_id")
        if not request_id or not job_id:
            logger.error("Invalid result event: %s", event)
            return

        job = self.job_service.get_job(request_id)
        if not job:
            logger.error("request_id=%s job not found", request_id)
            return

        ctx = job.get("context_json") or {}
        if isinstance(ctx, str):
            ctx = json.loads(ctx)

        company = ctx.get("company")
        product = ctx.get("product")
        category_name = ctx.get("category_name", job.get("category"))
        category_country = ctx.get("category_country", job.get("country"))

        logger.info(
            "request_id=%s job_id=%s resuming pipeline category='%s' total_leads=%s",
            request_id,
            job_id,
            category_name,
            event.get("total_leads"),
        )

        leads = self.prospector.load_leads_by_job_id(job_id, category_country)
        if not leads:
            logger.warning("request_id=%s no leads with phone in DB", request_id)
            return

        channel_id = self.flow.get_active_whatsapp_channel(
            company["tenant_id"], company["id"]
        )
        if not channel_id:
            logger.warning("request_id=%s no WhatsApp channel", request_id)
            return

        campaign_crew = build_campaign_crew(company=company, product=product, leads=leads)
        campaign_crew.kickoff()

        campaign_raw = campaign_crew.tasks[1].output.raw.strip()
        if campaign_raw.startswith("```json"):
            campaign_raw = campaign_raw[7:]
        if campaign_raw.endswith("```"):
            campaign_raw = campaign_raw[:-3]
        campaign_raw = campaign_raw.strip()

        try:
            campaign_json = json.loads(campaign_raw)
        except Exception:
            logger.warning("request_id=%s invalid campaign JSON", request_id)
            return

        message_body = campaign_json.get("message")
        if not message_body:
            return

        qual_raw = campaign_crew.tasks[0].output.raw.strip()
        if qual_raw.startswith("```json"):
            qual_raw = qual_raw[7:]
        if qual_raw.endswith("```"):
            qual_raw = qual_raw[:-3]
        qual_raw = qual_raw.strip()

        try:
            qualified_leads = json.loads(qual_raw)
            if isinstance(qualified_leads, dict) and "qualified_leads" in qualified_leads:
                qualified_leads = qualified_leads["qualified_leads"]
        except Exception:
            qualified_leads = leads

        sending_list_id = self.flow.get_or_create_sending_list(
            company["tenant_id"], company["id"], category_name
        )
        contact_ids = self.flow.save_qualified_leads_to_crm(
            company["tenant_id"], company["id"], sending_list_id, qualified_leads
        )
        if not contact_ids:
            return

        scheduled_at = datetime.now() + timedelta(days=2)
        campaign_id = self.flow.create_campaign_in_db(
            tenant_id=company["tenant_id"],
            company_id=company["id"],
            category_name=category_name,
            sending_list_id=sending_list_id,
            channel_id=channel_id,
            message_body=message_body,
            product_id=product.get("id"),
            scheduled_at=scheduled_at,
        )
        if campaign_id:
            self.flow.call_scheduler_service(
                tenant_id=company["tenant_id"],
                company_id=company["id"],
                campaign_id=campaign_id,
                campaign_name=f"{product.get('product_name')} - {category_name}",
                scheduled_at=scheduled_at,
            )
            self.flow.sync_redis_campaign_context(
                contact_ids=contact_ids,
                campaign_id=campaign_id,
                product_id=product.get("id"),
                company_id=company["id"],
            )
            logger.info(
                "request_id=%s campaign completed campaign_id=%s contacts=%s",
                request_id,
                campaign_id,
                len(contact_ids),
            )

    def on_search_error(self, event: dict) -> None:
        logger.error(
            "request_id=%s lead search failed error=%s retryable=%s retries=%s",
            event.get("request_id"),
            event.get("error"),
            event.get("retryable"),
            event.get("retries"),
        )
