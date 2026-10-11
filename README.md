# apps2026

Misc apps for 2026 or what's is remaining

## Web app / math worksheet

Createa javascript component that acts like a math worksheet

### App

- initially a stati web page with embedded java script sered from git actions

### Component: Math Grid

Provides a way to use it as a math worksheet.
User can click on a cell and an entry window opens below
Either an on-screen keyboard (numbers, operations) or in phase 2 an pad for handwriting recongintion of one character at a time.
clicking on a border - creates a border (to create a line for substraction or a vertical bar for division grid)
Clicking where a decimal dot would be - decimal
clicking on a full cell expands the row so that there is a space for carry over

### Current steps

Lay out the screen — Done: split the screen into a worksheet view and a virtual keyboard. On phones, keep the keyboard reachable while letting the worksheet use the remaining space.
Define worksheet state — Represent the sheet as rows and columns of cells, with each cell holding its entered value. Track the active cell and selected range.
Render the grid — Show row numbers and column labels, draw cell borders, and highlight the active cell. Make the grid scrollable in both directions without scrolling the whole page.
Connect the virtual keyboard — Send number and operator taps to the active cell. Add editing behavior for backspace, clear, and moving between cells; preserve the user’s cursor or selection where practical.
Support direct editing — Allow text entry from a physical keyboard and provide a suitable mobile input mode. Ensure focus and selection remain clear when switching between the worksheet and virtual keyboard.
Add spreadsheet navigation — Move the active cell with arrow or Enter controls, and decide how tapping a cell, scrolling, and committing an edit affect selection.
Add formulas and results — Parse the supported arithmetic operators, calculate formula results, and display invalid or incomplete formulas clearly rather than silently changing them.
Handle larger sheets — Test scrolling and rendering with more rows and columns. If needed, render only visible cells to keep interaction responsive.
Test key workflows — Cover tapping a cell, entering and editing values, entering a formula with the virtual keyboard, moving between cells, and using the grid on a narrow screen.
