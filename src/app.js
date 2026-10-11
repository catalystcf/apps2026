import { getNextCellValue } from "./cell-input.js";

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

const rowCount = 12;
const columnCount = 8;
const cellValues = new Map();
let activeCell = null;

for (let row = 0; row < rowCount; row += 1) {
  for (let column = 0; column < columnCount; column += 1) {
    const cell = document.createElement("button");
    cell.className = "worksheet-cell";
    cell.type = "button";
    cell.setAttribute("aria-pressed", "false");
    cell.setAttribute(
      "aria-label",
      `Row ${row + 1}, column ${column + 1}, empty`,
    );
    cell.addEventListener("click", () => {
      activeCell?.setAttribute("aria-pressed", "false");
      activeCell = cell;
      activeCell.setAttribute("aria-pressed", "true");
      status.textContent = `Row ${row + 1}, column ${column + 1} selected`;
      keypad.querySelectorAll("button").forEach((key) => {
        key.disabled = false;
      });
    });
    grid.append(cell);
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
    const cellIndex = Array.from(grid.children).indexOf(activeCell);
    const currentValue = cellValues.get(cellIndex) ?? "";
    const nextValue = getNextCellValue(currentValue, keyDefinition);

    if (nextValue) {
      cellValues.set(cellIndex, nextValue);
    } else {
      cellValues.delete(cellIndex);
    }

    activeCell.textContent = nextValue;
    const cellPosition = Array.from(grid.children).indexOf(activeCell);
    const row = Math.floor(cellPosition / columnCount) + 1;
    const column = (cellPosition % columnCount) + 1;
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
