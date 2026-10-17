import { expect, test } from "vitest";
import {
  getMathOption,
  mathOptions,
  toggleMathOption,
} from "../src/math-options.js";

test("offers fraction and carry/borrow options", () => {
  expect(mathOptions.map((option) => option.description)).toEqual([
    "Fraction",
    "Carry/borrow",
  ]);
  expect(getMathOption("fraction").label).toBe("1/2");
});

test("selecting an option records it", () => {
  expect(toggleMathOption(new Set(), "fraction")).toEqual(new Set(["fraction"]));
});

test("options can be selected independently and toggled off", () => {
  const selected = toggleMathOption(new Set(["fraction"]), "carry-borrow");
  expect(selected).toEqual(new Set(["fraction", "carry-borrow"]));
  expect(toggleMathOption(selected, "fraction")).toEqual(
    new Set(["carry-borrow"]),
  );
});

test("unknown options leave the selection unchanged", () => {
  const selected = new Set(["fraction"]);
  expect(toggleMathOption(selected, "nope")).toBe(selected);
});
