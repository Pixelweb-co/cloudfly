import os
from cachetools import TTLCache

def get_cache():
    ttl = int(os.getenv("CACHE_TTL", "300"))
    return TTLCache(maxsize=1024, ttl=ttl)
