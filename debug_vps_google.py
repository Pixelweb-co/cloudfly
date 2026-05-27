import httpx
import urllib.parse
import asyncio

async def run():
    query = "peluquerias en Colombia"
    encoded = urllib.parse.quote_plus(query)
    url = f"https://www.google.com/search?q={encoded}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.8"
    }
    
    async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
        resp = await client.get(url, headers=headers)
        print("Status code:", resp.status_code)
        print("Response length:", len(resp.text))
        print("HTML snippet (first 1000 chars):")
        print(resp.text[:1000])

asyncio.run(run())
