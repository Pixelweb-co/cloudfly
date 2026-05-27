#!/usr/bin/env python3
"""Run an Apify actor from the command line.

Usage examples:
  python scripts/run_apify_actor.py --actor-id compass/crawler-google-places --input '{"query":"peluqueria,medellin"}'
  python scripts/run_apify_actor.py --actor-id compass/crawler-google-places --keyword "peluqueria" --country "Colombia" --wait

The script will use the token passed with `--token`, or the APIFY_TOKEN env var, or the embedded default token.
"""
import argparse
import json
import os
import sys
from apify_client import ApifyClient
from apify_client import ApifyApiError

# Default token provided (from user); it's recommended to use env var or CLI arg instead of storing secrets.
DEFAULT_APIFY_TOKEN = os.getenv("APIFY_TOKEN", "")


def main():
    p = argparse.ArgumentParser(description="Run an Apify actor with JSON input or keyword/country filters.")
    p.add_argument("--actor-id", required=True, help="Apify actor id (e.g. compass/crawler-google-places)")
    p.add_argument("--input", help="Raw JSON string to pass as actor input")
    p.add_argument("--keyword", help="Shortcut: provide keyword to build a typical actor input")
    p.add_argument("--country", help="Shortcut country field")
    p.add_argument("--token", help="Apify API token (overrides env and built-in default)")
    p.add_argument("--wait", action="store_true", help="Wait for the actor start response (call is synchronous) and print run info")
    args = p.parse_args()

    token = args.token or os.getenv("APIFY_TOKEN") or DEFAULT_APIFY_TOKEN
    if not token:
        print("No Apify token provided. Use --token or set APIFY_TOKEN.")
        sys.exit(1)

    client = ApifyClient(token=token)

    # Build actor input
    if args.input:
        try:
            actor_input = json.loads(args.input)
        except Exception as e:
            print(f"Failed to parse --input JSON: {e}")
            sys.exit(2)
    else:
        actor_input = {}
        if args.keyword:
            # common structure used by our lead-generator actors
            actor_input["query"] = args.keyword
        if args.country:
            actor_input["country"] = args.country

    print(f"Calling actor '{args.actor_id}' with input: {json.dumps(actor_input, ensure_ascii=False)}")

    try:
        run = client.actor(args.actor_id).call(run_input=actor_input)
        print("Actor started:")
        print(json.dumps(run, indent=2, ensure_ascii=False))
    except ApifyApiError as e:
        print("Apify API error:")
        print(str(e))
        sys.exit(3)
    except Exception as e:
        print("Unexpected error while calling Apify actor:")
        print(str(e))
        sys.exit(4)


if __name__ == "__main__":
    main()
