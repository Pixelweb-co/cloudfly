from .services.meta_ads_service import MetaAdsService


def main():
    """Entry point for the marketing agent.

    The function validates the Facebook credentials on startup.  If
    the credentials are missing or invalid the application will exit
    with a clear error message – this prevents the service from
    running in a broken state.
    """
    meta_service = MetaAdsService()
    if not meta_service.verify_token():
        raise RuntimeError("Invalid or missing Facebook credentials – aborting startup")
    # TODO: continue with the rest of the bootstrap (Kafka, DB, etc.)


if __name__ == "__main__":
    main()
