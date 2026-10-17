export const mathOptions = [
  { id: "fraction", label: "1/2", description: "Fraction" },
  { id: "carry-borrow", label: "", description: "Carry/borrow" },
];

export function getMathOption(id) {
  return mathOptions.find((option) => option.id === id) ?? null;
}

// Selecting an option toggles it without affecting the other selections.
export function toggleMathOption(selectedIds, nextId) {
  if (!getMathOption(nextId)) {
    return selectedIds;
  }

  const nextSelectedIds = new Set(selectedIds);
  if (nextSelectedIds.has(nextId)) {
    nextSelectedIds.delete(nextId);
  } else {
    nextSelectedIds.add(nextId);
  }

  return nextSelectedIds;
}
