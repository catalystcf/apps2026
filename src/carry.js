export const maxCarryDigits = 2;

export function getNextCarryValue(currentValue, keyDefinition) {
  if (keyDefinition.action === "clear") {
    return "";
  }

  const digit = keyDefinition.value ?? "";
  if (!/^[0-9]$/.test(digit)) {
    return currentValue;
  }

  return currentValue.length < maxCarryDigits ? currentValue + digit : digit;
}

// Where the carry placeholder sits relative to the selected cell: centered
// over its column, roughly one cell above it.
export function getCarrySlotRect(cellRect) {
  const width = cellRect.width * 0.9;
  const height = cellRect.height * 0.75;

  return {
    x: cellRect.x + (cellRect.width - width) / 2,
    y: cellRect.y - cellRect.height * 0.95,
    width,
    height,
  };
}

// A hand-drawn looking blob ("splat") around the selected cell, tall enough
// to include the carry placeholder above it.
export function getSplatPath(cellRect, lobes = 5) {
  const centerX = cellRect.x + cellRect.width / 2;
  const centerY = cellRect.y + cellRect.height * 0.15;
  const radiusX = cellRect.width * 2;
  const radiusY = cellRect.height * 2.1;
  const pointCount = lobes * 2;
  const points = [];

  for (let index = 0; index < pointCount; index += 1) {
    const angle = -Math.PI / 2 + (index / pointCount) * Math.PI * 2;
    const scale = index % 2 === 0 ? 1 : 0.86;
    points.push([
      centerX + Math.cos(angle) * radiusX * scale,
      centerY + Math.sin(angle) * radiusY * scale,
    ]);
  }

  // Closed Catmull-Rom spline converted to cubic Bézier segments.
  const round = (value) => Math.round(value * 10) / 10;
  let path = `M${round(points[0][0])} ${round(points[0][1])}`;
  for (let index = 0; index < pointCount; index += 1) {
    const p0 = points[(index - 1 + pointCount) % pointCount];
    const p1 = points[index];
    const p2 = points[(index + 1) % pointCount];
    const p3 = points[(index + 2) % pointCount];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    path += ` C${round(c1[0])} ${round(c1[1])} ${round(c2[0])} ${round(c2[1])} ${round(p2[0])} ${round(p2[1])}`;
  }

  return `${path} Z`;
}
