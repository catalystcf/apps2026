import { getNextCellValue } from "./cell-input.js";
import {
  getBorderLine,
  getCellBorderEdge,
  hasBorderAroundCell,
  isNearDecimalPoint,
  toggleBorderLine,
} from "./cell-borders.js";

const app = document.createElement("div");
app.className = "app-shell";

const header = document.createElement("header");
header.className = "app-header";

const title = document.createElement("h1");
title.className = "app-title";
title.textContent = "Math";

const status = document.createElement("span");
status.className = "app-status";
status.setAttribute("aria-live", "polite");
status.textContent = "Select a cell to start";

header.append(title, status);

const workspace = document.createElement("main");
workspace.className = "workspace";

const worksheet = document.createElement("section");
worksheet.className = "worksheet-panel";
worksheet.setAttribute("aria-label", "Worksheet area");

const grid = document.createElement("div");
grid.className = "worksheet-grid";
grid.setAttribute("aria-label", "Worksheet cells");

const minimumRowCount = 12;
let rowCount = minimumRowCount;
let columnCount = 8;
const cellValues = new Map();
const borderLines = new Set();
const decimalPoints = new Set();
let activeCell = null;
let activePosition = null;
let hoveredBorder = null;
let hoveredDecimal = null;

function getCellKey(row, column) {
  return `${row}:${column}`;
}

function clearHoveredBorder() {
  if (hoveredBorder) {
    grid.children[hoveredBorder.cellIndex].removeAttribute("data-hover-edge");
    hoveredBorder = null;
  }
}

function clearHoveredDecimal() {
  if (hoveredDecimal !== null) {
    grid.children[hoveredDecimal].removeAttribute("data-hover-decimal");
    hoveredDecimal = null;
  }
}

function updateHoveredBorder(cell, row, column, event) {
  const edge = getCellBorderEdge(
    event.clientX,
    event.clientY,
    cell.getBoundingClientRect(),
  );

  if (edge) {
    clearHoveredDecimal();
    const nextBorder = getBorderLine(row, column, edge, columnCount);
    if (hoveredBorder?.key === nextBorder.key) {
      return;
    }

    clearHoveredBorder();
    hoveredBorder = nextBorder;
    grid.children[hoveredBorder.cellIndex].setAttribute(
      "data-hover-edge",
      hoveredBorder.edge,
    );
    return;
  }

  clearHoveredBorder();
  const cellIndex = row * columnCount + column;
  const nearDecimalPoint =
    !hasBorderAroundCell(borderLines, row, column) &&
    isNearDecimalPoint(
      event.clientX,
      event.clientY,
      cell.getBoundingClientRect(),
    );

  if (nearDecimalPoint && hoveredDecimal !== cellIndex) {
    clearHoveredDecimal();
    hoveredDecimal = cellIndex;
    cell.setAttribute("data-hover-decimal", "true");
  } else if (!nearDecimalPoint) {
    clearHoveredDecimal();
  }
}

function renderCells() {
  clearHoveredBorder();
  clearHoveredDecimal();
  activeCell = null;
  grid.replaceChildren();

  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      const cell = document.createElement("button");
      const key = getCellKey(row, column);
      const value = cellValues.get(key) ?? "";
      cell.className = "worksheet-cell";
      cell.type = "button";
      const borderSegments = ["top", "right", "bottom", "left"].map((edge) => {
        const segment = document.createElement("span");
        segment.className = `cell-border cell-border--${edge}`;
        segment.setAttribute("aria-hidden", "true");
        const borderKey = {
          top: `h:${row}:${column}`,
          right: `v:${row}:${column + 1}`,
          bottom: `h:${row + 1}:${column}`,
          left: `v:${row}:${column}`,
        }[edge];
        if (borderLines.has(borderKey)) {
          cell.setAttribute(`data-border-${edge}`, "true");
          cell.setAttribute("data-has-border", "true");
        }
        return segment;
      });
      const cellValue = document.createElement("span");
      cellValue.className = "worksheet-cell-value";
      cellValue.textContent = value;
      const decimalPoint = document.createElement("span");
      decimalPoint.className = "cell-decimal";
      decimalPoint.setAttribute("aria-hidden", "true");
      cell.append(...borderSegments, cellValue, decimalPoint);
      cell.setAttribute(
        "aria-pressed",
        activePosition?.row === row && activePosition?.column === column
          ? "true"
          : "false",
      );
      cell.setAttribute(
        "aria-label",
        `Row ${row + 1}, column ${column + 1}, ${value || "empty"}`,
      );
      if (decimalPoints.has(key)) {
        cell.setAttribute("data-decimal", "true");
      }
      if (activePosition?.row === row && activePosition?.column === column) {
        activeCell = cell;
      }

      cell.addEventListener("pointermove", (event) => {
        updateHoveredBorder(cell, row, column, event);
      });
      cell.addEventListener("pointerleave", () => {
        clearHoveredBorder();
        clearHoveredDecimal();
      });
      cell.addEventListener("click", (event) => {
        const edge = getCellBorderEdge(
          event.clientX,
          event.clientY,
          cell.getBoundingClientRect(),
        );

        if (edge) {
          const line = getBorderLine(row, column, edge, columnCount);
          const enabled = toggleBorderLine(borderLines, line.key);
          const lineCell = grid.children[line.cellIndex];

          if (enabled) {
            lineCell.setAttribute(`data-border-${line.edge}`, "true");
            lineCell.setAttribute("data-has-border", "true");
          } else {
            lineCell.removeAttribute(`data-border-${line.edge}`);
            if (
              !["top", "right", "bottom", "left"].some((borderEdge) =>
                lineCell.hasAttribute(`data-border-${borderEdge}`),
              )
            ) {
              lineCell.removeAttribute("data-has-border");
            }
          }

          if (enabled) {
            for (let borderRow = 0; borderRow < rowCount; borderRow += 1) {
              for (
                let borderColumn = 0;
                borderColumn < columnCount;
                borderColumn += 1
              ) {
                const decimalKey = getCellKey(borderRow, borderColumn);
                if (
                  decimalPoints.has(decimalKey) &&
                  hasBorderAroundCell(borderLines, borderRow, borderColumn)
                ) {
                  decimalPoints.delete(decimalKey);
                  grid.children[
                    borderRow * columnCount + borderColumn
                  ].removeAttribute("data-decimal");
                }
              }
            }
          }

          status.textContent = enabled ? "Border added" : "Border removed";
          return;
        }

        if (
          isNearDecimalPoint(
            event.clientX,
            event.clientY,
            cell.getBoundingClientRect(),
          )
        ) {
          if (hasBorderAroundCell(borderLines, row, column)) {
            status.textContent = "Decimal point unavailable in a bordered cell";
            return;
          }

          decimalPoints.add(key);
          cell.setAttribute("data-decimal", "true");
          cell.removeAttribute("data-hover-decimal");
          hoveredDecimal = null;
          status.textContent = `Decimal point added to row ${row + 1}, column ${column + 1}`;
          return;
        }

        activeCell?.setAttribute("aria-pressed", "false");
        activeCell = cell;
        activePosition = { row, column };
        activeCell.setAttribute("aria-pressed", "true");
        status.textContent = `Row ${row + 1}, column ${column + 1} selected`;
        keypad.querySelectorAll("button").forEach((keyButton) => {
          keyButton.disabled = false;
        });
      });
      grid.append(cell);
    }
  }
}

worksheet.append(grid);

const keyboard = document.createElement("section");
keyboard.className = "keyboard-panel";
keyboard.setAttribute("aria-label", "Virtual keyboard");

const keypad = document.createElement("div");
keypad.className = "keypad";
keypad.setAttribute("role", "group");
keypad.setAttribute("aria-label", "Virtual number and operator keyboard");

const keys = [
  { label: "7", value: "7" },
  { label: "8", value: "8" },
  { label: "9", value: "9" },
  { label: "/", value: "/", operator: true },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
  { label: "6", value: "6" },
  { label: "*", value: "*", operator: true },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "-", value: "-", operator: true },
  { label: "0", value: "0", zero: true },
  { label: ".", value: "." },
  { label: "=", value: "=", equals: true },
  { label: "+", value: "+", operator: true },
  { label: "Clear", action: "clear" },
];

for (const keyDefinition of keys) {
  const key = document.createElement("button");
  key.className = "key";
  key.type = "button";
  key.disabled = true;
  key.setAttribute("aria-label", keyDefinition.label);

  if (keyDefinition.operator) {
    key.classList.add("key--operator");
  }

  if (keyDefinition.zero) {
    key.classList.add("key--zero");
  }

  if (keyDefinition.equals) {
    key.classList.add("key--equals");
  }

  if (keyDefinition.action) {
    key.classList.add("key--action");
  }

  key.textContent = keyDefinition.label;
  key.addEventListener("click", () => {
    const cellKey = getCellKey(activePosition.row, activePosition.column);
    const currentValue = cellValues.get(cellKey) ?? "";
    const nextValue = getNextCellValue(currentValue, keyDefinition);

    if (nextValue) {
      cellValues.set(cellKey, nextValue);
    } else {
      cellValues.delete(cellKey);
    }

    activeCell.querySelector(".worksheet-cell-value").textContent = nextValue;
    const row = activePosition.row + 1;
    const column = activePosition.column + 1;
    activeCell.setAttribute(
      "aria-label",
      `Row ${row}, column ${column}, ${nextValue || "empty"}`,
    );
    status.textContent = nextValue
      ? `Entered ${nextValue} in row ${row}, column ${column}`
      : `Row ${row}, column ${column} cleared`;
  });
  keypad.append(key);
}

keyboard.append(keypad);
workspace.append(worksheet, keyboard);
app.append(header, workspace);
document.body.append(app);

function updateGridSize() {
  const styles = getComputedStyle(grid);
  const cellWidth = parseFloat(styles.gridAutoRows);
  const cellGap = parseFloat(styles.columnGap);
  const cellHeight = parseFloat(styles.gridAutoRows);
  const rowGap = parseFloat(styles.rowGap);
  const nextColumnCount =
    Math.ceil((grid.clientWidth + cellGap) / (cellWidth + cellGap)) + 2;
  const nextRowCount = Math.max(
    minimumRowCount,
    Math.ceil((grid.clientHeight + rowGap) / (cellHeight + rowGap)) + 2,
  );

  if (
    grid.clientWidth > 0 &&
    grid.clientHeight > 0 &&
    (nextColumnCount !== columnCount ||
      nextRowCount !== rowCount ||
      grid.childElementCount === 0)
  ) {
    columnCount = nextColumnCount;
    rowCount = nextRowCount;
    grid.style.gridTemplateColumns = `repeat(${columnCount}, 1cm)`;
    renderCells();
  }
}

updateGridSize();
new ResizeObserver(updateGridSize).observe(grid);
