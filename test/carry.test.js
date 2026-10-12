import { expect, test } from "vitest";
import {
  getCarrySlotRect,
  getNextCarryValue,
  getSplatPath,
} from "../src/carry.js";

test("carry digits append up to two digits", () => {
  expect(getNextCarryValue("", { value: "1" })).toBe("1");
  expect(getNextCarryValue("1", { value: "2" })).toBe("12");
});

test("a third digit starts the carry over", () => {
  expect(getNextCarryValue("12", { value: "3" })).toBe("3");
});

test("carry ignores operators and clears on clear", () => {
  expect(getNextCarryValue("1", { value: "+" })).toBe("1");
  expect(getNextCarryValue("1", { action: "decimal" })).toBe("1");
  expect(getNextCarryValue("12", { action: "clear" })).toBe("");
});

test("carry slot sits above the cell, centered on its column", () => {
  const slot = getCarrySlotRect({ x: 100, y: 100, width: 40, height: 40 });
  expect(slot.x + slot.width / 2).toBe(120);
  expect(slot.y).toBeLessThan(100);
  expect(slot.y + slot.height).toBeLessThanOrEqual(100);
});

test("splat path is a closed curve around the cell", () => {
  const path = getSplatPath({ x: 100, y: 100, width: 40, height: 40 });
  expect(path.startsWith("M")).toBe(true);
  expect(path.endsWith("Z")).toBe(true);
  expect(path.match(/C/g)).toHaveLength(10);
});
