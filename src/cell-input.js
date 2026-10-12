export function getNextCellValue(currentValue, keyDefinition) {
  if (keyDefinition.action === "clear") {
    return "";
  }

  return [...(keyDefinition.value ?? "")][0] ?? currentValue;
}

export function getKeyboardKeyDefinition(key) {
  if (key === "Backspace" || key === "Delete") {
    return { action: "clear" };
  }

  return key.length === 1 && !/\s/.test(key) ? { value: key } : null;
}
