// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  ipcMain,
} = require('electron');
const  _ = require('lodash');
// const console = require('console');
// app.console = new console.Console(process.stdout, process.stderr);
// process.stdout.write('your output to command prompt console or node js ');

console.log = (message) => {
  if (stripNode) {
    // stripNode.executeJavaScript(`console.log("console.log from electron")`);
    stripNode.executeJavaScript(`console.log(${JSON.stringify(message)})`);
  }
};

app.disableHardwareAcceleration();
let stripWindow;
let stripNode;

const { U } = require('win32-api');
const { DTypes } = require('win32-def');
const { DModel } = require('win32-def');
const ffi = require('ffi-napi');
const ref = require('ref-napi');

const user32Additional = ffi.Library("user32", {
  GetWindowTextLengthW: ["int", ["pointer"]],
  SetWinEventHook: ["int", ["int", "int", "pointer", "pointer", "int", "int", "int"]],
  SetWindowPos: ["int", ["int", "int", "int", "int", "int", "int", "int"]],
});

let pfnWinEventProc = null;

const user32 = U.load();

setTimeout(function () {
  const appWindow = user32.GetForegroundWindow();
  console.log('appWindow');
  console.log(appWindow);

  // user32.SetWindowTextW(appWindow, Buffer.from('OKOK' + '\0', 'ucs2'));

  const msgType = ref.types.void;
  const msgPtr = ref.refType(msgType);
  const EVENT_SYSTEM_FOREGROUND = 3;
  const WINEVENT_OUTOFCONTEXT = 0;
  const WINEVENT_SKPIOWNPROCESS = 2;

  // const positionSetter = (position) => {
  //   user32Additional.SetWindowPos(
  //     appWindow,
  //     0,
  //     position.readUInt32LE(0),
  //     position.readUInt32LE(4),
  //     position.readUInt32LE(8) - position.readUInt32LE(0),
  //     position.readUInt32LE(12) - position.readUInt32LE(4),
  //     0x0010
  //   );
  // };

  let move = false;
  let foreGroundWindow = user32.GetForegroundWindow();

  const moveFunction = _.throttle(() => {
    console.log(foreGroundWindow);
    if (move) {
      const strct = Buffer.alloc(4 * 4);
      user32.GetWindowRect(foreGroundWindow, strct);
      user32Additional.SetWindowPos(
        appWindow,
        -2,
        strct.readUInt32LE(0),
        strct.readUInt32LE(4) + 40,
        strct.readUInt32LE(8) - strct.readUInt32LE(0),
        strct.readUInt32LE(12) - strct.readUInt32LE(4) - 40,
        0x0010
      );

      user32Additional.SetWindowPos(
        foreGroundWindow,
        appWindow,
        strct.readUInt32LE(0),
        strct.readUInt32LE(4),
        strct.readUInt32LE(8) - strct.readUInt32LE(0),
        strct.readUInt32LE(12) - strct.readUInt32LE(4),
        0x0002
      );
    }
    moveFunction();
  }, move ? 1 : 1);

  moveFunction();

  pfnWinEventProc = ffi.Callback("void", ["pointer", "int", "pointer", "long", "long", "int", "int"],
  function (hWinEventHook, event, hwnd, idObject, idChild, idEventThread, dwmsEventTime) {
    console.log('------');
    console.log(event);
    foreGroundWindow = user32.GetForegroundWindow();

    if (event === 10) {
      move = true;

    } else {
      move = false;
    }
  });

  user32Additional.SetWinEventHook(
    10,
    11,
    null,
    pfnWinEventProc,
    0,
    0,
    0 | 2
  );
}, 1000);

const launchStrip = () => {
  // Create the browser window.

  stripWindow = new BrowserWindow({
    width: 600,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  stripWindow.loadURL(`file://${__dirname}/test.html`);
  stripNode = stripWindow && stripWindow.webContents;

  // setInterval(func, 1000);

  console.log("Strip launched");

  stripWindow.on('closed', () => {
    stripNode = null;
    stripWindow = null;
  });
};

app.on('ready', async () => {
  setTimeout(() => {
    launchStrip();
  }, 400);
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
