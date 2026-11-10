from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    APP_NAME: str = "ClarioAI"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    SUPABASE_URL: str
    SUPABASE_KEY: str


    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()