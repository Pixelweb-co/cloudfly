import httpx
import re
import urllib.parse
import sys

async def run():
    query = "peluquerias en Colombia"
    encoded_query = urllib.parse.quote_plus(query)
    url = f"https://html.duckduckgo.com/html/?q={encoded_query}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3"
    }
    print(f"Connecting to {url}...")
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
            resp = await client.get(url, headers=headers)
            print("Status code:", resp.status_code)
            print("Response length:", len(resp.text))
            
            h2_blocks = re.findall(r'<h2 class="result__title">(.*?)</h2>', resp.text, re.DOTALL)
            print("H2 blocks count:", len(h2_blocks))
            if not h2_blocks:
                print("HTML Snippet (first 500 chars):")
                print(resp.text[:500])
    except Exception as e:
        print("Error connecting:", e)

import asyncio
asyncio.run(run())
