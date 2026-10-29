const { app, BrowserWindow, dialog, net, protocol, shell } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const WWW = path.join(__dirname, "www");

// Serve the built app from app://niimblue/ — a secure origin, so Web Bluetooth/Serial, workers and ES modules all work.
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

// Native picker in place of Chrome's device chooser. Returns the chosen item or undefined.
async function pick(win, title, items, label) {
  if (items.length === 0) {
    await dialog.showMessageBox(win, { type: "info", message: `No ${title} found.` });
    return undefined;
  }
  const { response } = await dialog.showMessageBox(win, {
    type: "question",
    message: `Select ${title}`,
    buttons: [...items.map(label), "Cancel"],
    cancelId: items.length,
  });
  return items[response];
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "NiimBlue",
    autoHideMenuBar: true,
    icon: path.join(WWW, "favicon-512.png"),
  });

  const ses = win.webContents.session;
  ses.setPermissionCheckHandler(() => true);
  ses.setDevicePermissionHandler(() => true);

  // Bluetooth: devices stream in while scanning; collect for a few seconds, then let the user choose.
  let btScan = null;
  win.webContents.on("select-bluetooth-device", (event, devices, callback) => {
    event.preventDefault();
    if (btScan) {
      btScan.devices = devices;
      return;
    }
    btScan = { devices };
    setTimeout(async () => {
      const found = btScan.devices;
      btScan = null;
      const d = await pick(win, "Bluetooth printer", found, (x) => x.deviceName || x.deviceId);
      callback(d ? d.deviceId : "");
    }, 4000);
  });

  ses.on("select-serial-port", async (event, ports, _wc, callback) => {
    event.preventDefault();
    const p = await pick(win, "serial port", ports, (x) => x.displayName || x.portName);
    callback(p ? p.portId : "");
  });

  // Links like GitHub/docs open in the real browser, not inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.loadURL("app://niimblue/");
}

app.whenReady().then(() => {
  protocol.handle("app", (req) => {
    const p = decodeURIComponent(new URL(req.url).pathname);
    return net.fetch(pathToFileURL(path.join(WWW, p === "/" ? "index.html" : p)).toString());
  });
  createWindow();
  app.on("activate", () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});

app.on("window-all-closed", () => process.platform !== "darwin" && app.quit());
