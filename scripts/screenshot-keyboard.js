// Renders src/keyboard-demo.html in headless Chrome and saves a PNG of the
// keyboard for each layout to docs/screenshots/<layout>/keyboard.png.
//
//   npm run screenshots              # every layout
//   npm run screenshots -- wide      # only the named layouts
//
// Set CHROME_PATH if Chrome or Edge is not found automatically.

import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "src");
const outDir = join(root, "docs", "screenshots");

// One entry per layout the CSS distinguishes (breakpoints in src/index.html
// and src/keyboard.css). Sizes are CSS pixels; images are rendered at 2x.
const layouts = {
  wide: { width: 1280, height: 800 },
  phone: { width: 390, height: 844 },
  small: { width: 320, height: 568 },
};
const deviceScaleFactor = 2;
// Extra room around the keyboard so its shadow and rounded corners show.
const margin = 6;

const browserCandidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function startServer() {
  const server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url, "http://x").pathname);
    const file = join(srcDir, path);
    if (!file.startsWith(srcDir + sep) || !existsSync(file)) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      "Content-Type": contentTypes[extname(file)] ?? "application/octet-stream",
    });
    response.end(readFileSync(file));
  });
  return new Promise((resolveServer) => {
    server.listen(0, "127.0.0.1", () => resolveServer(server));
  });
}

async function launchBrowser() {
  const executable = browserCandidates.find((path) => path && existsSync(path));
  if (!executable) {
    throw new Error(
      "Chrome or Edge not found. Set CHROME_PATH to its executable.",
    );
  }

  const profileDir = mkdtempSync(join(tmpdir(), "keyboard-screenshot-"));
  const browser = spawn(
    executable,
    [
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${profileDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );

  // Chrome prints its DevTools WebSocket address to stderr once it is ready.
  const endpoint = await new Promise((resolveEndpoint, reject) => {
    let output = "";
    const timer = setTimeout(
      () => reject(new Error("Chrome did not start in time.")),
      15000,
    );
    browser.stderr.on("data", (chunk) => {
      output += chunk;
      const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) {
        clearTimeout(timer);
        resolveEndpoint(match[1]);
      }
    });
    browser.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Chrome exited early (code ${code}).\n${output}`));
    });
  });

  return { browser, profileDir, endpoint };
}

function connect(endpoint) {
  const socket = new WebSocket(endpoint);
  const pending = new Map();
  const listeners = [];
  let nextId = 1;

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolveCall, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolveCall(message.result);
      }
    } else if (message.method) {
      listeners.forEach((listener) => listener(message));
    }
  });

  const send = (method, params = {}, sessionId) =>
    new Promise((resolveCall, reject) => {
      const id = nextId++;
      pending.set(id, { resolveCall, reject });
      socket.send(JSON.stringify({ id, method, params, sessionId }));
    });

  const waitFor = (method, sessionId) =>
    new Promise((resolveEvent) => {
      const listener = (message) => {
        if (message.method === method && message.sessionId === sessionId) {
          listeners.splice(listeners.indexOf(listener), 1);
          resolveEvent(message.params);
        }
      };
      listeners.push(listener);
    });

  return new Promise((resolveConnection, reject) => {
    socket.addEventListener("open", () =>
      resolveConnection({ send, waitFor, close: () => socket.close() }),
    );
    socket.addEventListener("error", () =>
      reject(new Error("DevTools connection failed.")),
    );
  });
}

async function screenshotKeyboard(cdp, sessionId, url, layout) {
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { ...layout, deviceScaleFactor, mobile: false },
    sessionId,
  );
  const loaded = cdp.waitFor("Page.loadEventFired", sessionId);
  await cdp.send("Page.navigate", { url }, sessionId);
  await loaded;

  const { result, exceptionDetails } = await cdp.send(
    "Runtime.evaluate",
    {
      expression: `(async () => {
        await document.fonts.ready;
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const panel = document.querySelector(".keyboard-panel");
        if (!panel) return null;
        const { x, y, width, height } = panel.getBoundingClientRect();
        return { x, y, width, height };
      })()`,
      awaitPromise: true,
      returnByValue: true,
    },
    sessionId,
  );
  if (exceptionDetails || !result.value) {
    throw new Error(`Keyboard did not render at ${url}`);
  }

  const box = result.value;
  const x = Math.max(0, box.x - margin);
  const y = Math.max(0, box.y - margin);
  const clip = {
    x,
    y,
    width: Math.min(layout.width, box.x + box.width + margin) - x,
    height: Math.min(layout.height, box.y + box.height + margin) - y,
    scale: 1,
  };
  const { data } = await cdp.send(
    "Page.captureScreenshot",
    { format: "png", clip },
    sessionId,
  );
  return Buffer.from(data, "base64");
}

async function main() {
  const requested = process.argv.slice(2);
  const unknown = requested.filter((name) => !(name in layouts));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown layout: ${unknown.join(", ")}. Choose from ${Object.keys(layouts).join(", ")}.`,
    );
  }
  const names = requested.length > 0 ? requested : Object.keys(layouts);

  const server = await startServer();
  const { browser, profileDir, endpoint } = await launchBrowser();
  try {
    const cdp = await connect(endpoint);
    const { targetId } = await cdp.send("Target.createTarget", {
      url: "about:blank",
    });
    const { sessionId } = await cdp.send("Target.attachToTarget", {
      targetId,
      flatten: true,
    });
    await cdp.send("Page.enable", {}, sessionId);

    const url = `http://127.0.0.1:${server.address().port}/keyboard-demo.html`;
    for (const name of names) {
      const png = await screenshotKeyboard(cdp, sessionId, url, layouts[name]);
      const file = join(outDir, name, "keyboard.png");
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, png);
      console.log(`Saved ${file.slice(root.length + 1).replaceAll("\\", "/")}`);
    }

    await cdp.send("Browser.close").catch(() => {});
    cdp.close();
  } finally {
    if (browser.exitCode === null) {
      const exited = new Promise((resolveExit) =>
        browser.once("exit", resolveExit),
      );
      browser.kill();
      await exited;
    }
    server.close();
    try {
      rmSync(profileDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 200,
      });
    } catch {
      // A leftover temp profile is harmless; the OS cleans its temp folder.
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
