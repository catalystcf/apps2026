import { getKeyboardKeyDefinition, getNextCellValue } from "./cell-input.js";
import {
  getBorderLine,
  getCellBorderEdge,
  isNearDecimalPoint,
  toggleDecimalPoint,
  toggleBorderLine,
} from "./cell-borders.js";

const app = document.createElement("div");
app.className = "app-shell";
if (/Android/i.test(navigator.userAgent)) {
  app.classList.add("app-shell--android");
}

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
let followPointerAfterKeyboard = false;
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
      return true;
    }

    clearHoveredBorder();
    hoveredBorder = nextBorder;
    grid.children[hoveredBorder.cellIndex].setAttribute(
      "data-hover-edge",
      hoveredBorder.edge,
    );
    return true;
  }

  clearHoveredBorder();
  const cellIndex = row * columnCount + column;
  const nearDecimalPoint = isNearDecimalPoint(
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

  return nearDecimalPoint;
}

function selectCell(
  cell,
  row,
  column,
  { announce = true, stopPointerFollowing = true } = {},
) {
  activeCell?.setAttribute("aria-pressed", "false");
  activeCell = cell;
  activePosition = { row, column };
  if (stopPointerFollowing) {
    followPointerAfterKeyboard = false;
  }
  activeCell.setAttribute("aria-pressed", "true");
  keypad.querySelectorAll("button").forEach((keyButton) => {
    keyButton.disabled = false;
  });

  if (announce) {
    status.textContent = `Row ${row + 1}, column ${column + 1} selected`;
  }
}

function toggleDecimalAtCell(row, column, cell) {
  const key = getCellKey(row, column);
  const enabled = toggleDecimalPoint(decimalPoints, key);
  if (enabled) {
    cell.setAttribute("data-decimal", "true");
  } else {
    cell.removeAttribute("data-decimal");
  }

  cell.removeAttribute("data-hover-decimal");
  hoveredDecimal = null;
  status.textContent = enabled
    ? `Decimal point added to row ${row + 1}, column ${column + 1}`
    : `Decimal point removed from row ${row + 1}, column ${column + 1}`;
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
        const overBorderOrDecimal = updateHoveredBorder(
          cell,
          row,
          column,
          event,
        );
        if (!overBorderOrDecimal && followPointerAfterKeyboard) {
          selectCell(cell, row, column, {
            announce: false,
            stopPointerFollowing: false,
          });
        }
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
          toggleDecimalAtCell(row, column, cell);
          return;
        }

        selectCell(cell, row, column);
      });
      grid.append(cell);
    }
  }
}

function updateActiveCell(keyDefinition) {
  if (!activePosition || !activeCell) {
    return;
  }

  if (keyDefinition.action === "decimal") {
    toggleDecimalAtCell(
      activePosition.row,
      activePosition.column,
      activeCell,
    );
    return;
  }

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
}

document.addEventListener("keydown", (event) => {
  const target = event.target;
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    (target instanceof HTMLElement &&
      (target.isContentEditable ||
        target.closest("input, textarea, select") !== null))
  ) {
    return;
  }

  const keyDefinition = getKeyboardKeyDefinition(event.key);
  if (!keyDefinition || !activeCell) {
    return;
  }

  event.preventDefault();
  updateActiveCell(keyDefinition);
  followPointerAfterKeyboard = true;
});

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
  { label: ".", action: "decimal" },
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
    updateActiveCell(keyDefinition);
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
