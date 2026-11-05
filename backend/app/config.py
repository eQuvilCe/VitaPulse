from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./vitapulse.db"
    secret_key: str = "dev-secret-change-me-please-use-32-bytes-min"
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://localhost:3000,http://localhost:3001"

    # AI coach; without a key every AI feature uses its deterministic fallback.
    anthropic_api_key: str = ""
    ai_model: str = "claude-sonnet-5-5"

    # Google sign-in; the feature is off until both id and secret are set.
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/callback"
    frontend_url: str = "http://localhost:3001"

    # Private uploads (progress photos) live here, outside any static route.
    media_dir: str = "./media"

    @property
    def ai_enabled(self) -> bool:
        return bool(self.anthropic_api_key)

    @property
    def google_enabled(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
