import { expect, test } from "vitest";
import {
  getBorderLine,
  getCellBorderEdge,
  hasBorderAroundCell,
  isNearDecimalPoint,
  toggleDecimalPoint,
  toggleBorderLine,
} from "../src/cell-borders.js";

test("detects a border edge only within the hit area", () => {
  const rect = { top: 10, right: 60, bottom: 60, left: 10 };

  expect(getCellBorderEdge(35, 12, rect)).toBe("top");
  expect(getCellBorderEdge(35, 14, rect)).toBe("top");
  expect(getCellBorderEdge(35, 16, rect)).toBeNull();
  expect(getCellBorderEdge(35, 35, rect)).toBeNull();
});

test("adjacent cells resolve to the same shared border", () => {
  expect(getBorderLine(2, 3, "right", 8)).toEqual({
    key: "v:2:4",
    cellIndex: 19,
    edge: "right",
  });
  expect(getBorderLine(2, 4, "left", 8)).toEqual({
    key: "v:2:4",
    cellIndex: 19,
    edge: "right",
  });
});

test("toggling a border adds it, then removes it", () => {
  const lines = new Set();

  expect(toggleBorderLine(lines, "h:3:4")).toBe(true);
  expect(lines.has("h:3:4")).toBe(true);
  expect(toggleBorderLine(lines, "h:3:4")).toBe(false);
  expect(lines.has("h:3:4")).toBe(false);
});

test("toggling a decimal point adds it, then removes it", () => {
  const points = new Set();

  expect(toggleDecimalPoint(points, "2:3")).toBe(true);
  expect(points.has("2:3")).toBe(true);
  expect(toggleDecimalPoint(points, "2:3")).toBe(false);
  expect(points.has("2:3")).toBe(false);
});

test("detects the decimal point hotspot and cell borders", () => {
  const rect = {
    top: 10,
    right: 110,
    bottom: 60,
    left: 10,
    width: 100,
    height: 50,
  };
  const lines = new Set(["v:2:4"]);

  expect(isNearDecimalPoint(99, 46, rect)).toBe(true);
  expect(isNearDecimalPoint(107, 46, rect)).toBe(true);
  expect(isNearDecimalPoint(108, 46, rect)).toBe(false);
  expect(isNearDecimalPoint(20, 30, rect)).toBe(false);
  expect(hasBorderAroundCell(lines, 2, 3)).toBe(true);
  expect(hasBorderAroundCell(lines, 2, 2)).toBe(false);
});
