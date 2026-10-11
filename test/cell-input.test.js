import { expect, test } from "vitest";
import { getNextCellValue } from "../src/cell-input.js";

test("a key replaces the current cell character", () => {
  expect(getNextCellValue("7", { value: "8" })).toBe("8");
});

test("a cell receives at most one character", () => {
  expect(getNextCellValue("", { value: "123" })).toBe("1");
});

test("clear empties the cell", () => {
  expect(getNextCellValue("7", { action: "clear" })).toBe("");
});
