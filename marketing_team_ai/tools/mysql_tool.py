import mysql.connector
from config import Config

class MySQLTool:

    @staticmethod
    def get_connection():
        return mysql.connector.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            database=Config.DB_NAME,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD
        )
