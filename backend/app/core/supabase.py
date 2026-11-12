from collections.abc import Iterator
from contextlib import contextmanager

import httpx
from postgrest import SyncPostgrestClient
from supabase import Client, create_client

from app.core.config import settings

supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY
)


@contextmanager
def user_scoped_postgrest_client(
    access_token: str,
) -> Iterator[SyncPostgrestClient]:
    """Yield a short-lived PostgREST client carrying the caller's JWT.

    Only the PostgREST component is constructed. Its HTTP session is closed on
    every exit, and the shared Supabase client's headers are never mutated.
    """
    headers = {
        **supabase.options.headers,
        "Authorization": f"Bearer {access_token}",
    }
    session = httpx.Client(
        headers=headers,
        timeout=supabase.options.postgrest_client_timeout,
        follow_redirects=True,
        http2=True,
    )
    try:
        scoped_client = SyncPostgrestClient(
            str(supabase.rest_url),
            schema=supabase.options.schema,
            headers=headers,
            http_client=session,
            retry_enabled=supabase.options.postgrest_client_retry,
        )
        yield scoped_client
    finally:
        session.close()
