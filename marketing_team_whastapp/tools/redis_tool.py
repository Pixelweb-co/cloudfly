import redis
from config import Config

class RedisTool:

    @staticmethod
    def get_client():
        return redis.Redis(
            host=Config.REDIS_HOST,
            port=Config.REDIS_PORT,
            password=Config.REDIS_PASSWORD,
            decode_responses=True
        )
