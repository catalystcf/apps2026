export const mathOptions = [
  { id: "fraction", label: "1/2", description: "Fraction" },
  { id: "carry-borrow", label: "", description: "Carry/borrow" },
];

export function getMathOption(id) {
  return mathOptions.find((option) => option.id === id) ?? null;
}

// Selecting the active option again turns it off.
export function selectMathOption(currentId, nextId) {
  if (!getMathOption(nextId)) {
    return currentId;
  }

  return currentId === nextId ? null : nextId;
}
