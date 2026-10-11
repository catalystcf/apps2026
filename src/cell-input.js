export function getNextCellValue(currentValue, keyDefinition) {
  if (keyDefinition.action === "clear") {
    return "";
  }

  return [...(keyDefinition.value ?? "")][0] ?? currentValue;
}
