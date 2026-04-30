import os
os.environ['DB_HOST'] = '127.0.0.1'
os.environ['MYSQL_HOST'] = '127.0.0.1'
os.environ['REDIS_HOST'] = '127.0.0.1'

import asyncio
import sys

# Add current dir to sys.path to import from ai-agent
sys.path.append(os.path.join(os.getcwd(), 'ai-agent'))

from infrastructure.mysql_client import AsyncMySQLClient

async def main():
    db = AsyncMySQLClient()
    await db.connect()
    async with db.readonly() as cur:
        await cur.execute('SELECT id, name, email, phone FROM contacts WHERE phone LIKE "%573245640657%" AND tenant_id = 1')
        rows = await cur.fetchall()
        for row in rows:
            print(row)
    await db.close()

if __name__ == "__main__":
    asyncio.run(main())
