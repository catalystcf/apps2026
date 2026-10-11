import { expect, test } from "vitest";
import {
  getBorderLine,
  getCellBorderEdge,
  toggleBorderLine,
} from "../src/cell-borders.js";

test("detects a border edge only within the hit area", () => {
  const rect = { top: 10, right: 110, bottom: 60, left: 10 };

  expect(getCellBorderEdge(50, 14, rect)).toBe("top");
  expect(getCellBorderEdge(50, 30, rect)).toBeNull();
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
