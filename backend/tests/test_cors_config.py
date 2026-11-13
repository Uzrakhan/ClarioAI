import unittest

from app.core.config import Settings


class FrontendCorsConfigTests(unittest.TestCase):
    def test_frontend_origins_are_parsed_as_exact_origins(self) -> None:
        settings = Settings(
            SUPABASE_URL="https://example.supabase.test",
            SUPABASE_KEY="synthetic-publishable-test-key",
            FRONTEND_ORIGINS="https://clario.example, http://localhost:3000/",
        )

        self.assertEqual(
            settings.frontend_origins,
            ["https://clario.example", "http://localhost:3000"],
        )


if __name__ == "__main__":
    unittest.main()
