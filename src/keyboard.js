export const keyboardKeys = [
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
  { label: "+", value: "+", operator: true },
  { label: "(", value: "(", operator: true },
  { label: ")", value: ")", operator: true },
];

const keypadIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8m-4-4v4M7 8h2m2 0h2m2 0h2M7 12h2m2 0h2m2 0h2" /></svg>';
const handwritingIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l11-11a2.1 2.1 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4M3 4v4m-2-2h4" /></svg>';

// Builds the virtual keyboard. It knows nothing about the worksheet: key
// presses are reported through `onKey`, and the caller fills the returned
// `handwritingPanel` with its own drawing surface.
export function createKeyboard({
  onKey = () => {},
  onClearDrawing = () => {},
} = {}) {
  let enabled = false;
  let handwritingMode = false;

  const element = document.createElement("section");
  element.className = "keyboard-panel";
  element.setAttribute("aria-label", "Virtual keyboard");

  const keypad = document.createElement("div");
  keypad.className = "keypad";
  keypad.setAttribute("role", "group");
  keypad.setAttribute("aria-label", "Virtual number and operator keyboard");

  const handwritingPanel = document.createElement("div");
  handwritingPanel.className = "handwriting-panel";
  handwritingPanel.id = "handwriting-panel";
  handwritingPanel.hidden = true;
  handwritingPanel.setAttribute("aria-label", "Handwriting drawing pad");

  const keypadFooter = document.createElement("div");
  keypadFooter.className = "keypad-footer";

  const equalsButton = document.createElement("button");
  equalsButton.className = "key key--equals";
  equalsButton.type = "button";
  equalsButton.setAttribute("aria-label", "=");
  equalsButton.textContent = "=";
  equalsButton.addEventListener("click", () => {
    onKey({ value: "=" });
  });

  const clearCellButton = document.createElement("button");
  clearCellButton.className = "key key--clear";
  clearCellButton.type = "button";
  clearCellButton.textContent = "Clear";
  clearCellButton.addEventListener("click", () => {
    if (handwritingMode) {
      onClearDrawing();
    } else {
      onKey({ action: "clear" });
    }
  });

  const handwritingButton = document.createElement("button");
  handwritingButton.className = "key key--handwriting";
  handwritingButton.type = "button";
  handwritingButton.setAttribute("aria-controls", "handwriting-panel");
  handwritingButton.addEventListener("click", () => {
    const openingPad = !handwritingMode;
    setHandwritingMode(openingPad);
    if (!openingPad) {
      handwritingButton.focus();
    }
  });

  for (const keyDefinition of keyboardKeys) {
    const key = document.createElement("button");
    key.className = "key";
    key.type = "button";
    key.setAttribute("aria-label", keyDefinition.label);

    if (keyDefinition.operator) {
      key.classList.add("key--operator");
    }

    if (keyDefinition.zero) {
      key.classList.add("key--zero");
    }

    key.textContent = keyDefinition.label;
    key.addEventListener("click", () => {
      onKey(keyDefinition);
    });
    keypad.append(key);
  }

  keypadFooter.append(equalsButton, clearCellButton, handwritingButton);
  element.append(keypad, keypadFooter, handwritingPanel);

  function setEnabled(nextEnabled) {
    enabled = nextEnabled;
    keypad.querySelectorAll(".key").forEach((keyButton) => {
      keyButton.disabled = !enabled;
    });
    equalsButton.disabled = !enabled || handwritingMode;
    clearCellButton.disabled = !enabled && !handwritingMode;
  }

  function setHandwritingMode(nextMode) {
    handwritingMode = nextMode;
    keypad.hidden = handwritingMode;
    handwritingPanel.hidden = !handwritingMode;
    handwritingButton.setAttribute("aria-expanded", String(handwritingMode));
    equalsButton.classList.toggle("key--placeholder", handwritingMode);
    clearCellButton.setAttribute(
      "aria-label",
      handwritingMode ? "Clear drawing" : "Clear selected cell",
    );
    const buttonLabel = handwritingMode
      ? "Return to number keypad"
      : "Open handwriting pad";
    handwritingButton.setAttribute("aria-label", buttonLabel);
    handwritingButton.title = buttonLabel;
    handwritingButton.innerHTML = handwritingMode
      ? keypadIcon
      : handwritingIcon;
    setEnabled(enabled);
  }

  setHandwritingMode(false);

  return {
    element,
    handwritingPanel,
    setEnabled,
    setHandwritingMode,
  };
}
