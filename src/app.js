import { getKeyboardKeyDefinition, getNextCellValue } from "./cell-input.js";
import {
  getBorderLine,
  getCellBorderEdge,
  isNearDecimalPoint,
  toggleDecimalPoint,
  toggleBorderLine,
} from "./cell-borders.js";
import { getCarrySlotRect, getNextCarryValue, getSplatPath } from "./carry.js";
import {
  mathOptions,
  toggleMathOption,
} from "./math-options.js";

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

const clearButton = document.createElement("button");
clearButton.className = "clear-button";
clearButton.type = "button";
clearButton.setAttribute("aria-label", "Clear worksheet");
clearButton.title = "Clear worksheet";
clearButton.innerHTML =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" /></svg>';

// Selected math options will decide what is shown around a clicked cell.
const selectedMathOptions = new Set();
const longHoverDelay = 600;

const titleGroup = document.createElement("div");
titleGroup.className = "app-title-group";

const optionsMenu = document.createElement("div");
optionsMenu.className = "math-options";

const optionsToggle = document.createElement("button");
optionsToggle.className = "math-options-toggle";
optionsToggle.type = "button";
optionsToggle.setAttribute("aria-haspopup", "true");
optionsToggle.setAttribute("aria-expanded", "false");
optionsToggle.setAttribute("aria-controls", "math-options-list");

const optionsList = document.createElement("div");
optionsList.className = "math-options-list";
optionsList.id = "math-options-list";
optionsList.setAttribute("role", "menu");
optionsList.setAttribute("aria-label", "Math options");
optionsList.hidden = true;

function createOptionIcon(option) {
  const icon = document.createElement("span");
  icon.className = `math-option-icon math-option-icon--${option.id}`;
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = option.label;
  return icon;
}

function updateOptionsToggle() {
  const caret = document.createElement("span");
  caret.className = "math-options-caret";
  caret.setAttribute("aria-hidden", "true");
  caret.textContent = "\u25BE";
  optionsToggle.replaceChildren(caret);
  optionsToggle.setAttribute("aria-label", "Math options");
}

const selectedOptionButton = document.createElement("div");
selectedOptionButton.className = "math-options-selected";
selectedOptionButton.hidden = true;

function setOptionsOpen(open) {
  optionsList.hidden = !open;
  optionsToggle.setAttribute("aria-expanded", String(open));
}

function updateOptionSelection() {
  optionButtons.forEach((button) => {
    const selected = selectedMathOptions.has(button.dataset.option);
    button.setAttribute("aria-checked", String(selected));
  });
  const selectedOptions = mathOptions.filter((option) =>
    selectedMathOptions.has(option.id),
  );
  selectedOptionButton.hidden = selectedOptions.length === 0;
  selectedOptionButton.replaceChildren(
    ...selectedOptions.map((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-pressed", "true");
      button.setAttribute(
        "aria-label",
        `${option.description} selected; click to turn off`,
      );
      button.append(createOptionIcon(option));
      button.addEventListener("click", () => {
        selectedMathOptions.delete(option.id);
        updateOptionSelection();
        status.textContent = `${option.description} turned off`;
      });
      return button;
    }),
  );
  updateOptionsToggle();
}

const optionButtons = mathOptions.map((option) => {
  const optionButton = document.createElement("button");
  optionButton.className = "math-option";
  optionButton.type = "button";
  optionButton.setAttribute("role", "menuitemcheckbox");
  optionButton.setAttribute("aria-checked", "false");
  optionButton.setAttribute("aria-label", option.description);
  optionButton.dataset.option = option.id;

  const description = document.createElement("span");
  description.className = "math-option-description";
  description.setAttribute("role", "tooltip");
  description.textContent = option.description;

  optionButton.append(createOptionIcon(option), description);

  // The description only appears after a long hover (or long press on touch).
  let hoverTimer = null;
  let suppressClick = false;
  const showDescription = () => {
    optionButton.setAttribute("data-show-description", "true");
  };
  const hideDescription = () => {
    clearTimeout(hoverTimer);
    hoverTimer = null;
    optionButton.removeAttribute("data-show-description");
  };

  optionButton.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") {
      hoverTimer = setTimeout(showDescription, longHoverDelay);
    }
  });
  optionButton.addEventListener("pointerdown", (event) => {
    suppressClick = false;
    if (event.pointerType !== "mouse") {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        showDescription();
        suppressClick = true;
      }, longHoverDelay);
    }
  });
  optionButton.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "mouse") {
      clearTimeout(hoverTimer);
    }
  });
  optionButton.addEventListener("pointerleave", hideDescription);
  optionButton.addEventListener("pointercancel", hideDescription);
  optionButton.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
  optionButton.addEventListener("click", () => {
    if (suppressClick) {
      suppressClick = false;
      hideDescription();
      return;
    }

    hideDescription();
    const wasSelected = selectedMathOptions.has(option.id);
    const nextSelection = toggleMathOption(selectedMathOptions, option.id);
    selectedMathOptions.clear();
    nextSelection.forEach((id) => selectedMathOptions.add(id));
    updateOptionSelection();
    setOptionsOpen(false);
    status.textContent = wasSelected
      ? `${option.description} turned off`
      : `${option.description} selected`;
  });

  return optionButton;
});

optionsList.append(...optionButtons);
optionsToggle.addEventListener("click", () => {
  setOptionsOpen(optionsList.hidden);
});
document.addEventListener("pointerdown", (event) => {
  if (!optionsList.hidden && !optionsMenu.contains(event.target)) {
    setOptionsOpen(false);
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !optionsList.hidden) {
    setOptionsOpen(false);
    optionsToggle.focus();
  }
});
updateOptionSelection();

optionsMenu.append(optionsToggle, selectedOptionButton, optionsList);
titleGroup.append(title, optionsMenu);
header.append(titleGroup, status, clearButton);

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
const carryValues = new Map();
let activeCell = null;
let entryTarget = "cell";
let activePosition = null;
let followPointerAfterKeyboard = false;
let selectedByPointerFollow = false;
let hoveredBorder = null;
let hoveredDecimal = null;

function getCellKey(row, column) {
  return `${row}:${column}`;
}

const svgNamespace = "http://www.w3.org/2000/svg";
const splat = document.createElementNS(svgNamespace, "svg");
splat.classList.add("selection-splat");
splat.setAttribute("aria-hidden", "true");
const splatDim = document.createElementNS(svgNamespace, "path");
splatDim.classList.add("selection-splat-dim");
splatDim.setAttribute("fill-rule", "evenodd");
const splatOutline = document.createElementNS(svgNamespace, "path");
splatOutline.classList.add("selection-splat-outline");
splat.append(splatDim, splatOutline);

const carryEditor = document.createElement("button");
carryEditor.type = "button";
carryEditor.className = "carry-editor";
const carrySlots = [0, 1].map(() => {
  const slot = document.createElement("span");
  slot.className = "carry-slot";
  return slot;
});
carryEditor.append(...carrySlots);
carryEditor.addEventListener("click", () => {
  if (activePosition) {
    setEntryTarget("carry");
  }
});

function getCellLabel(row, column) {
  const key = getCellKey(row, column);
  const value = cellValues.get(key);
  const carry = carryValues.get(key);
  return `Row ${row + 1}, column ${column + 1}, ${value || "empty"}${
    carry ? `, carry ${carry}` : ""
  }`;
}

function getCellRect(cell) {
  return {
    x: cell.offsetLeft,
    y: cell.offsetTop,
    width: cell.offsetWidth,
    height: cell.offsetHeight,
  };
}

function updateSplat() {
  grid.toggleAttribute("data-selecting", Boolean(activeCell));
  grid.toggleAttribute("data-carry-entry", entryTarget === "carry");
  if (!activeCell || !activePosition) {
    return;
  }

  const lastCell = grid.children[rowCount * columnCount - 1];
  const width = lastCell.offsetLeft + lastCell.offsetWidth;
  const height = lastCell.offsetTop + lastCell.offsetHeight;
  const cellRect = getCellRect(activeCell);
  const blob = getSplatPath(cellRect);
  splat.setAttribute("width", width);
  splat.setAttribute("height", height);
  splat.setAttribute("viewBox", `0 0 ${width} ${height}`);
  splatDim.setAttribute("d", `M0 0 H${width} V${height} H0 Z ${blob}`);
  splatOutline.setAttribute("d", blob);

  const carry = carryValues.get(
    getCellKey(activePosition.row, activePosition.column),
  );
  const slotRect = getCarrySlotRect(cellRect);
  Object.assign(carryEditor.style, {
    left: `${slotRect.x}px`,
    top: `${slotRect.y}px`,
    width: `${slotRect.width}px`,
    height: `${slotRect.height}px`,
  });
  carrySlots.forEach((slot, index) => {
    slot.textContent = carry?.[index] ?? "";
  });
  // A filled-in carry shrinks to its small badge on the cell until it is
  // tapped again; an empty one keeps showing the placeholder to tap.
  carryEditor.hidden = entryTarget !== "carry" && Boolean(carry);
  carryEditor.setAttribute(
    "aria-label",
    carry ? `Edit carry ${carry}` : "Add carry or borrow",
  );
}

function setEntryTarget(target) {
  entryTarget = target;
  updateSplat();
  if (activePosition) {
    const position = `row ${activePosition.row + 1}, column ${activePosition.column + 1}`;
    status.textContent =
      target === "carry"
        ? `Enter carry for ${position}`
        : `Row ${activePosition.row + 1}, column ${activePosition.column + 1} selected`;
  }
}

function setCellEntryKeysEnabled(enabled) {
  keypad.querySelectorAll(".key").forEach((keyButton) => {
    keyButton.disabled = !enabled;
  });
  equalsButton.disabled = !enabled || !handwritingPanel.hidden;
  clearCellButton.disabled = !enabled && handwritingPanel.hidden;
}

function clearSelection() {
  setHandwritingMode(false);
  activeCell?.setAttribute("aria-pressed", "false");
  activeCell?.blur();
  activeCell = null;
  activePosition = null;
  entryTarget = "cell";
  followPointerAfterKeyboard = false;
  setCellEntryKeysEnabled(false);
  updateSplat();
  status.textContent = "Select a cell to start";
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
  entryTarget = "cell";
  selectedByPointerFollow = !stopPointerFollowing;
  if (stopPointerFollowing) {
    followPointerAfterKeyboard = false;
  }
  activeCell.setAttribute("aria-pressed", "true");
  setCellEntryKeysEnabled(true);

  updateSplat();

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
      const carryBadge = document.createElement("span");
      carryBadge.className = "cell-carry";
      carryBadge.setAttribute("aria-hidden", "true");
      carryBadge.textContent = carryValues.get(key) ?? "";
      cell.append(...borderSegments, cellValue, decimalPoint, carryBadge);
      cell.setAttribute(
        "aria-pressed",
        activePosition?.row === row && activePosition?.column === column
          ? "true"
          : "false",
      );
      cell.setAttribute("aria-label", getCellLabel(row, column));
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
        const isActive = activeCell === cell;
        if (event.target.closest(".cell-carry") && carryBadge.textContent) {
          if (!isActive) {
            selectCell(cell, row, column);
          }
          setEntryTarget("carry");
          return;
        }

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

        if (isActive && entryTarget === "carry") {
          setEntryTarget("cell");
          return;
        }

        // A cell reached by the pointer following the keyboard is not a
        // second tap, so it stays selected instead of closing the splat.
        if (isActive && !selectedByPointerFollow) {
          clearSelection();
          return;
        }

        selectCell(cell, row, column);
      });
      grid.append(cell);
    }
  }

  grid.append(splat, carryEditor);
  updateSplat();
}

function updateActiveCarry(keyDefinition) {
  const cellKey = getCellKey(activePosition.row, activePosition.column);
  const currentValue = carryValues.get(cellKey) ?? "";
  const nextValue = getNextCarryValue(currentValue, keyDefinition);

  if (nextValue) {
    carryValues.set(cellKey, nextValue);
  } else {
    carryValues.delete(cellKey);
  }

  activeCell.querySelector(".cell-carry").textContent = nextValue;
  activeCell.setAttribute(
    "aria-label",
    getCellLabel(activePosition.row, activePosition.column),
  );
  updateSplat();
  const position = `row ${activePosition.row + 1}, column ${activePosition.column + 1}`;
  status.textContent = nextValue
    ? `Carry ${nextValue} in ${position}`
    : `Carry cleared in ${position}`;
}

function clearWorksheet() {
  setHandwritingMode(false);
  cellValues.clear();
  borderLines.clear();
  decimalPoints.clear();
  activePosition = null;
  followPointerAfterKeyboard = false;
  clearHoveredBorder();
  clearHoveredDecimal();
  renderCells();
  setCellEntryKeysEnabled(false);
  status.textContent = "Worksheet cleared";
}

clearButton.addEventListener("click", clearWorksheet);

function updateActiveCell(keyDefinition) {
  if (!activePosition || !activeCell) {
    return;
  }

  if (entryTarget === "carry") {
    updateActiveCarry(keyDefinition);
    return;
  }

  if (keyDefinition.action === "decimal") {
    toggleDecimalAtCell(activePosition.row, activePosition.column, activeCell);
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
    getCellLabel(activePosition.row, activePosition.column),
  );
  status.textContent = nextValue
    ? `Entered ${nextValue} in row ${row}, column ${column}`
    : `Row ${row}, column ${column} cleared`;
}

document.addEventListener("keydown", (event) => {
  const target = event.target;
  if (
    !optionsList.hidden ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    (target instanceof HTMLElement &&
      (target.isContentEditable ||
        target.closest("input, textarea, select") !== null))
  ) {
    return;
  }

  if (event.key === "Escape" && activeCell) {
    event.preventDefault();
    if (entryTarget === "carry") {
      setEntryTarget("cell");
    } else {
      clearSelection();
    }
    return;
  }

  const keyDefinition = getKeyboardKeyDefinition(event.key);
  if (!keyDefinition || !activeCell) {
    return;
  }

  event.preventDefault();
  updateActiveCell(keyDefinition);
  followPointerAfterKeyboard = entryTarget === "cell";
});

worksheet.append(grid);

const keyboard = document.createElement("section");
keyboard.className = "keyboard-panel";
keyboard.setAttribute("aria-label", "Virtual keyboard");

const keypad = document.createElement("div");
keypad.className = "keypad";
keypad.setAttribute("role", "group");
keypad.setAttribute("aria-label", "Virtual number and operator keyboard");

const handwritingPanel = document.createElement("div");
handwritingPanel.className = "handwriting-panel";
handwritingPanel.hidden = true;
handwritingPanel.setAttribute("aria-label", "Handwriting drawing pad");

const handwritingCanvas = document.createElement("canvas");
handwritingCanvas.className = "handwriting-canvas";
handwritingCanvas.setAttribute("aria-label", "Drawing surface for one character");
handwritingCanvas.setAttribute("role", "img");

handwritingPanel.append(handwritingCanvas);

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
  { label: "0", value: "0" },
  { label: ".", action: "decimal" },
  { label: "+", value: "+", operator: true },
  { label: "(", value: "(", operator: true },
  { label: ")", value: ")", operator: true },
];

const keypadFooter = document.createElement("div");
keypadFooter.className = "keypad-footer";

const equalsButton = document.createElement("button");
equalsButton.className = "key key--equals";
equalsButton.type = "button";
equalsButton.disabled = true;
equalsButton.setAttribute("aria-label", "=");
equalsButton.textContent = "=";
equalsButton.addEventListener("click", () => {
  updateActiveCell({ value: "=" });
});

const clearCellButton = document.createElement("button");
clearCellButton.className = "key key--clear";
clearCellButton.type = "button";
clearCellButton.disabled = true;
clearCellButton.setAttribute("aria-label", "Clear");
clearCellButton.textContent = "Clear";
clearCellButton.addEventListener("click", () => {
  if (handwritingPanel.hidden) {
    updateActiveCell({ action: "clear" });
    return;
  }

  drawingStrokes.length = 0;
  activeDrawingStroke = null;
  drawingPointerId = null;
  redrawHandwriting();
});

const handwritingButton = document.createElement("button");
handwritingButton.className = "key key--handwriting";
handwritingButton.type = "button";
handwritingButton.setAttribute("aria-controls", "handwriting-panel");
handwritingButton.setAttribute("aria-expanded", "false");

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

  key.textContent = keyDefinition.label;
  key.addEventListener("click", () => {
    updateActiveCell(keyDefinition);
  });
  keypad.append(key);
}

keypadFooter.append(equalsButton, clearCellButton, handwritingButton);
handwritingPanel.id = "handwriting-panel";
keyboard.append(keypad, keypadFooter, handwritingPanel);
workspace.append(worksheet, keyboard);
app.append(header, workspace);
document.body.append(app);

function updateHandwritingButton(enabled) {
  handwritingButton.setAttribute(
    "aria-label",
    enabled ? "Return to number keypad" : "Open handwriting pad",
  );
  handwritingButton.title = enabled ? "Return to number keypad" : "Open handwriting pad";
  handwritingButton.innerHTML = enabled
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8m-4-4v4M7 8h2m2 0h2m2 0h2M7 12h2m2 0h2m2 0h2" /></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l11-11a2.1 2.1 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4M3 4v4m-2-2h4" /></svg>';
}

handwritingButton.addEventListener("click", () => {
  const openingPad = handwritingPanel.hidden;
  setHandwritingMode(openingPad);
  if (!openingPad) {
    handwritingButton.focus();
  }
});

function setHandwritingMode(enabled) {
  keypad.hidden = enabled;
  handwritingPanel.hidden = !enabled;
  handwritingButton.setAttribute("aria-expanded", String(enabled));
  equalsButton.classList.toggle("key--placeholder", enabled);
  clearCellButton.setAttribute(
    "aria-label",
    enabled ? "Clear drawing" : "Clear selected cell",
  );
  setCellEntryKeysEnabled(Boolean(activeCell));
  updateHandwritingButton(enabled);
}

setHandwritingMode(false);

const drawingContext = handwritingCanvas.getContext("2d");
if (!drawingContext) {
  throw new Error("Unable to create a 2D context for the handwriting pad.");
}

const drawingStrokes = [];
let activeDrawingStroke = null;
let drawingPointerId = null;

function redrawHandwriting() {
  const bounds = handwritingCanvas.getBoundingClientRect();
  if (bounds.width === 0 || bounds.height === 0) {
    return;
  }

  drawingContext.clearRect(0, 0, bounds.width, bounds.height);
  drawingContext.lineWidth = Math.max(3, Math.min(bounds.width, bounds.height) * 0.07);
  drawingContext.lineCap = "round";
  drawingContext.lineJoin = "round";
  drawingContext.strokeStyle = "#263548";

  for (const stroke of drawingStrokes) {
    if (stroke.length === 0) {
      continue;
    }

    drawingContext.beginPath();
    drawingContext.moveTo(
      stroke[0].x * bounds.width,
      stroke[0].y * bounds.height,
    );
    for (const point of stroke.slice(1)) {
      drawingContext.lineTo(point.x * bounds.width, point.y * bounds.height);
    }
    drawingContext.stroke();
  }
}

function resizeHandwritingCanvas() {
  const bounds = handwritingCanvas.getBoundingClientRect();
  if (bounds.width === 0 || bounds.height === 0) {
    return;
  }

  const pixelRatio = window.devicePixelRatio || 1;
  handwritingCanvas.width = Math.round(bounds.width * pixelRatio);
  handwritingCanvas.height = Math.round(bounds.height * pixelRatio);
  drawingContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  redrawHandwriting();
}

function addDrawingPoint(event) {
  const bounds = handwritingCanvas.getBoundingClientRect();
  activeDrawingStroke.push({
    x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
    y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
  });
  redrawHandwriting();
}

handwritingCanvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  drawingPointerId = event.pointerId;
  activeDrawingStroke = [];
  drawingStrokes.push(activeDrawingStroke);
  handwritingCanvas.setPointerCapture(event.pointerId);
  addDrawingPoint(event);
});
handwritingCanvas.addEventListener("pointermove", (event) => {
  if (event.pointerId === drawingPointerId && activeDrawingStroke) {
    addDrawingPoint(event);
  }
});
function finishDrawingStroke(event) {
  if (event.pointerId === drawingPointerId) {
    activeDrawingStroke = null;
    drawingPointerId = null;
  }
}
handwritingCanvas.addEventListener("pointerup", finishDrawingStroke);
handwritingCanvas.addEventListener("pointercancel", finishDrawingStroke);

const handwritingResizeObserver = new ResizeObserver(resizeHandwritingCanvas);
handwritingResizeObserver.observe(handwritingCanvas);
window.addEventListener("resize", resizeHandwritingCanvas);

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
