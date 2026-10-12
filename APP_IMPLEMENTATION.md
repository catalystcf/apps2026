# Math Worksheet App: Implementation Guide

This guide describes the current implementation so future changes can follow
the app's existing state and interaction patterns.

## Source map

- `src/index.html` is the entry page. It contains the app's CSS and loads
  `src/app.js` as an ES module.
- `src/app.js` builds the interface, owns worksheet state, creates cells,
  connects pointer and keyboard interactions, and resizes the grid.
- `src/cell-input.js` contains pure helpers for translating keyboard keys and
  applying one-character cell edits.
- `src/cell-borders.js` contains pure helpers for border hit-testing, shared
  border identity, decimal-point toggling, and border toggling.
- `test/cell-input.test.js` and `test/cell-borders.test.js` cover those pure
  helpers.

## Interface and layout

`app.js` creates a header with a live status message, a worksheet panel with
the cell grid, a clear-worksheet icon button, and a virtual keypad. The cell
buttons and keypad keys are created dynamically. The clear button empties all
cell values, removes borders and decimal points, clears the active cell, and
disables the keypad until a cell is selected again.

The layout and visual states are styled in the `<style>` block in
`index.html`. Grid cells currently use 1cm CSS tracks with a 1px gap. The grid
scrolls in both directions inside the worksheet panel. Border strokes,
decimal indicators, active-cell highlighting, and keypad states are controlled
with CSS classes and `data-*` attributes.

`updateGridSize()` in `app.js` measures the grid's available space and CSS
track sizes, then creates enough rows and columns to extend slightly beyond
the viewport. `ResizeObserver` reruns it when the grid changes size. Before
changing how the grid is sized, keep `rowCount`, `columnCount`, the rendered
cell count, and the CSS grid tracks in sync.

## Worksheet state

State is currently held in in-memory collections in `app.js`:

- `cellValues`: `Map` keyed by `"row:column"`; stores the single character in a
  cell.
- `decimalPoints`: `Set` of `"row:column"` keys for visible decimal dots.
- `borderLines`: `Set` of canonical shared-line keys:
  - `"h:row:column"` for horizontal lines.
  - `"v:row:column"` for vertical lines.
- `activePosition` and `activeCell`: the selected cell's coordinates and DOM
  node.
- `rowCount` and `columnCount`: current rendered dimensions.

Values and decimal points are keyed by coordinates rather than child index, so
they survive grid re-rendering and dimension changes. Border keys likewise
identify grid lines rather than individual cell sides.

## Interaction flow

### Selecting a cell and entering a value

Clicking an ordinary cell calls `selectCell()`, which updates the active
position, visual pressed state, keypad availability, and status text. Physical
keyboard events are handled at the document level. Ctrl/Meta/Alt combinations
and events from editable controls are ignored.

`getKeyboardKeyDefinition()` maps a physical key to a key definition;
Backspace/Delete map to clear, and `.` maps to the decimal action.
`updateActiveCell()` is shared by physical keyboard and keypad input. It calls
`getNextCellValue()` for ordinary input and updates both the value map and
cell's accessible label. `.` toggles the visual decimal point instead of
replacing the cell character.

The cell accepts one character: normal input replaces its previous character.
To change this behavior, update the helper and its tests rather than adding a
separate editing path to a UI event handler.

### Borders

`getCellBorderEdge()` in `cell-borders.js` returns the nearest edge when the
pointer is within the hit width (currently 5px). `getBorderLine()` maps either
side of a shared cell edge to the same canonical key and identifies which
rendered cell owns the visible stroke.

Pointer movement previews the edge in blue. Clicking it toggles the line in
`borderLines` and updates the owning cell's `data-border-*` attribute.
`hasBorderAroundCell()` can be used to query whether any of a cell's four
edges are drawn; currently a decimal point is allowed in a bordered cell.

### Decimal points

`isNearDecimalPoint()` in `cell-borders.js` defines the decimal hover/click
hotspot relative to a cell's bounding rectangle. The matching visual position
is set by `.cell-decimal` in `index.html`; keep these offsets aligned.
`toggleDecimalAtCell()` updates the coordinate set and the cell's
`data-decimal` attribute. The hollow hover preview uses
`data-hover-decimal`.

### Pointer selection after keyboard input

After physical keyboard input, pointer movement may move the active highlight
to the cell under the pointer. `followPointerAfterKeyboard` gates this behavior.
Border and decimal hotspots are excluded, and clicking a cell stops this
pointer-follow behavior. Preserve those distinctions when changing pointer
handlers.

## Extending the app safely

- Store worksheet content by row/column coordinates, not by DOM index.
- When rerendering, restore values, borders, decimal dots, and active-cell
  state from the in-memory collections.
- Route physical and virtual key input through `updateActiveCell()` and the
  helpers in `cell-input.js`.
- Keep border and decimal hit testing in `cell-borders.js` so it can be tested
  without a browser DOM.
- Keep hit-test geometry synchronized with CSS visual positions.
- Update or add focused tests for pure helper behavior in `test/`.
- Update relevant documentation when changing interaction or state behavior.

## Current scope and limitations

- Worksheet state is in memory only; it does not persist after a page reload.
- The app renders a grid and supports single-character entry, borders, and
  decimal markers. Formula parsing, calculation, row/column headers,
  multi-cell selection, and carry rows are not implemented yet.
- The keypad is part of the interface generated by `app.js`; its visibility is
  determined by the current markup, CSS, and any device-specific class logic.
- `package.json` provides `npm test`, `npm run lint`, `npm run format:check`,
  and `npm run build`.
