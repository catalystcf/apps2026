import { expect, test } from "vitest";
import {
  getMathOption,
  mathOptions,
  selectMathOption,
} from "../src/math-options.js";

test("offers fraction and carry/borrow options", () => {
  expect(mathOptions.map((option) => option.description)).toEqual([
    "Fraction",
    "Carry/borrow",
  ]);
  expect(getMathOption("fraction").label).toBe("1/2");
});

test("selecting an option records it", () => {
  expect(selectMathOption(null, "fraction")).toBe("fraction");
  expect(selectMathOption("fraction", "carry-borrow")).toBe("carry-borrow");
});

test("selecting the active option again clears it", () => {
  expect(selectMathOption("fraction", "fraction")).toBeNull();
});

test("unknown options leave the selection unchanged", () => {
  expect(selectMathOption("fraction", "nope")).toBe("fraction");
});
