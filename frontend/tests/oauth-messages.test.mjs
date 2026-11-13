import assert from "node:assert/strict";
import test from "node:test";
import { classifyOAuthFailure, oauthErrorMessage } from "../src/lib/oauth-messages.ts";

test("identifies an OAuth cancellation from either provider error field", () => {
  assert.equal(classifyOAuthFailure("access_denied", null), "cancelled");
  assert.equal(classifyOAuthFailure(null, "access_denied"), "cancelled");
});

test("classifies other callback errors as a generic failure", () => {
  assert.equal(classifyOAuthFailure("server_error", "provider_error"), "failed");
});

test("does not treat a clean callback as a failure", () => {
  assert.equal(classifyOAuthFailure(null, null), null);
});

test("shows clear UI copy without echoing provider error details", () => {
  assert.match(oauthErrorMessage("cancelled"), /cancelled/i);
  assert.match(oauthErrorMessage("failed"), /try again/i);
  assert.equal(oauthErrorMessage("unexpected-secret"), "");
});
