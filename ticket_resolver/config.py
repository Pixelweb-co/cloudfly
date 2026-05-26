import os
from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    JIRA_URL: str = Field(..., env='JIRA_URL')
    JIRA_USER: str = Field(..., env='JIRA_USER')
    JIRA_TOKEN: str = Field(..., env='JIRA_TOKEN')
    JIRA_JQL: str = Field('status = "Pendientes"', env='JIRA_JQL')
    DB_URL: str = Field(..., env='DB_URL')
    SYNC_INTERVAL: int = Field(300, env='SYNC_INTERVAL')

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'

settings = Settings()