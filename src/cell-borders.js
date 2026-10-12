export function getCellBorderEdge(clientX, clientY, rect, hitSize = 5) {
  const distances = {
    top: clientY - rect.top,
    right: rect.right - clientX,
    bottom: rect.bottom - clientY,
    left: clientX - rect.left,
  };
  const [edge, distance] = Object.entries(distances).reduce((closest, entry) =>
    entry[1] < closest[1] ? entry : closest,
  );

  return distance >= 0 && distance <= hitSize ? edge : null;
}

export function isNearDecimalPoint(clientX, clientY, rect, hitSize = 8) {
  const pointX = rect.right - 11;
  const pointY = rect.bottom - 14;

  return Math.hypot(clientX - pointX, clientY - pointY) <= hitSize;
}

export function hasBorderAroundCell(lines, row, column) {
  return (
    lines.has(`v:${row}:${column}`) ||
    lines.has(`v:${row}:${column + 1}`) ||
    lines.has(`h:${row}:${column}`) ||
    lines.has(`h:${row + 1}:${column}`)
  );
}

export function toggleDecimalPoint(points, key) {
  if (points.has(key)) {
    points.delete(key);
    return false;
  }

  points.add(key);
  return true;
}

export function getBorderLine(row, column, edge, columnCount) {
  const cellIndex = row * columnCount + column;

  if (edge === "left") {
    return {
      key: `v:${row}:${column}`,
      cellIndex: column > 0 ? cellIndex - 1 : cellIndex,
      edge: column > 0 ? "right" : "left",
    };
  }

  if (edge === "right") {
    return { key: `v:${row}:${column + 1}`, cellIndex, edge };
  }

  if (edge === "top") {
    return {
      key: `h:${row}:${column}`,
      cellIndex: row > 0 ? cellIndex - columnCount : cellIndex,
      edge: row > 0 ? "bottom" : "top",
    };
  }

  if (edge === "bottom") {
    return { key: `h:${row + 1}:${column}`, cellIndex, edge };
  }

  return null;
}

export function toggleBorderLine(lines, key) {
  if (lines.has(key)) {
    lines.delete(key);
    return false;
  }

  lines.add(key);
  return true;
}
