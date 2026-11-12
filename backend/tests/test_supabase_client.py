import os
import unittest
from unittest.mock import MagicMock, patch

# Force synthetic configuration before importing the module-level Supabase client.
os.environ["SUPABASE_URL"] = "https://example.supabase.test"
os.environ["SUPABASE_KEY"] = "test-api-key"

from app.core import supabase as supabase_module


class UserScopedPostgrestClientTests(unittest.TestCase):
    def test_scoped_headers_are_isolated_and_session_is_closed(self) -> None:
        shared_headers = dict(supabase_module.supabase.options.headers)
        session = MagicMock()
        scoped_client = MagicMock()

        with (
            patch.object(supabase_module.httpx, "Client", return_value=session) as http_client,
            patch.object(
                supabase_module,
                "SyncPostgrestClient",
                return_value=scoped_client,
            ) as postgrest_client,
        ):
            with supabase_module.user_scoped_postgrest_client(
                "caller-access-token"
            ) as client:
                self.assertIs(client, scoped_client)

        request_headers = http_client.call_args.kwargs["headers"]
        self.assertEqual(
            request_headers["Authorization"], "Bearer caller-access-token"
        )
        self.assertEqual(
            request_headers["apiKey"], supabase_module.supabase.supabase_key
        )
        self.assertEqual(
            postgrest_client.call_args.kwargs["http_client"], session
        )
        session.close.assert_called_once_with()
        self.assertEqual(supabase_module.supabase.options.headers, shared_headers)

    def test_session_closes_when_the_query_raises(self) -> None:
        session = MagicMock()

        with (
            patch.object(supabase_module.httpx, "Client", return_value=session),
            patch.object(
                supabase_module,
                "SyncPostgrestClient",
                return_value=MagicMock(),
            ),
        ):
            with self.assertRaises(RuntimeError):
                with supabase_module.user_scoped_postgrest_client("caller-token"):
                    raise RuntimeError("synthetic query failure")

        session.close.assert_called_once_with()


if __name__ == "__main__":
    unittest.main()
