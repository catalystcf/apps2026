import { expect, test } from "vitest";
import {
  getKeyboardKeyDefinition,
  getNextCellValue,
} from "../src/cell-input.js";

test("a key replaces the current cell character", () => {
  expect(getNextCellValue("7", { value: "8" })).toBe("8");
});

test("a cell receives at most one character", () => {
  expect(getNextCellValue("", { value: "123" })).toBe("1");
});

test("clear empties the cell", () => {
  expect(getNextCellValue("7", { action: "clear" })).toBe("");
});

test("physical characters replace the current cell character", () => {
  expect(getKeyboardKeyDefinition("4")).toEqual({ value: "4" });
  expect(getNextCellValue("7", getKeyboardKeyDefinition("+"))).toBe("+");
  expect(getKeyboardKeyDefinition(".")).toEqual({ value: "." });
});

test("backspace and delete clear the current cell", () => {
  expect(getKeyboardKeyDefinition("Backspace")).toEqual({ action: "clear" });
  expect(getKeyboardKeyDefinition("Delete")).toEqual({ action: "clear" });
  expect(getNextCellValue("7", getKeyboardKeyDefinition("Backspace"))).toBe("");
});

test("non-character keys are ignored", () => {
  expect(getKeyboardKeyDefinition("ArrowLeft")).toBeNull();
  expect(getKeyboardKeyDefinition(" ")).toBeNull();
});
