const app = document.createElement("div");
app.className = "app-shell";

const header = document.createElement("header");
header.className = "app-header";

const title = document.createElement("h1");
title.className = "app-title";
title.textContent = "Math Worksheet";

const status = document.createElement("span");
status.className = "app-status";
status.textContent = "Ready for your work";

header.append(title, status);

const workspace = document.createElement("main");
workspace.className = "workspace";

const worksheet = document.createElement("section");
worksheet.className = "worksheet-panel";
worksheet.setAttribute("aria-labelledby", "worksheet-heading");

const worksheetHeading = document.createElement("h2");
worksheetHeading.className = "panel-heading";
worksheetHeading.id = "worksheet-heading";
worksheetHeading.textContent = "Worksheet";

const paper = document.createElement("div");
paper.className = "worksheet-paper";
paper.textContent = "Your worksheet";

worksheet.append(worksheetHeading, paper);

const keyboard = document.createElement("section");
keyboard.className = "keyboard-panel";
keyboard.setAttribute("aria-labelledby", "keyboard-heading");

const keyboardHeading = document.createElement("div");
keyboardHeading.className = "keyboard-heading";

const keyboardTitle = document.createElement("h2");
keyboardTitle.className = "panel-heading";
keyboardTitle.id = "keyboard-heading";
keyboardTitle.textContent = "Keyboard";

const keyboardHint = document.createElement("span");
keyboardHint.className = "keyboard-hint";
keyboardHint.textContent = "Numbers & operators";

keyboardHeading.append(keyboardTitle, keyboardHint);

const keypad = document.createElement("div");
keypad.className = "keypad";
keypad.setAttribute("role", "group");
keypad.setAttribute("aria-label", "Virtual number and operator keyboard");

const keys = [
  { label: "7" },
  { label: "8" },
  { label: "9" },
  { label: "/", operator: true },
  { label: "4" },
  { label: "5" },
  { label: "6" },
  { label: "*", operator: true },
  { label: "1" },
  { label: "2" },
  { label: "3" },
  { label: "-", operator: true },
  { label: "0", zero: true },
  { label: "." },
  { label: "=", equals: true },
  { label: "+", operator: true },
];

for (const keyDefinition of keys) {
  const key = document.createElement("div");
  key.className = "key";

  if (keyDefinition.operator) {
    key.classList.add("key--operator");
  }

  if (keyDefinition.zero) {
    key.classList.add("key--zero");
  }

  if (keyDefinition.equals) {
    key.classList.add("key--equals");
  }

  key.textContent = keyDefinition.label;
  keypad.append(key);
}

keyboard.append(keyboardHeading, keypad);
workspace.append(worksheet, keyboard);
app.append(header, workspace);
document.body.append(app);
