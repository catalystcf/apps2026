import { expect, test } from "vitest";
import { smokeTestStub } from "../src/smoke_test_stub.js";

test("smoke test passes", () => {
  expect(smokeTestStub()).toBe(true);
});
