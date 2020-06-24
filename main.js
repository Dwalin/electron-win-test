// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  ipcMain,
} = require('electron');
const  _ = require('lodash');

console.log = (message) => {
  if (stripNode) {
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
const windows = [];

const user32Additional = ffi.Library("user32", {
  GetWindowTextLengthW: ["int", ["pointer"]],
  SetWinEventHook: ["int", ["int", "int", "pointer", "pointer", "int", "int", "int"]],
  SetWindowPos: ["int", ["int", "int", "int", "int", "int", "int", "int"]],
  GetWindowTextA : ['long', ['long', ref.refType(ref.types.CString), 'long']],
  SetWindowTextA : ['long', ['long', ref.refType(ref.types.CString)]],
  EnumChildWindows : ['bool', ['long', ref.refType(ref.types.void), 'int32']],
  EnumThreadWindows  : ['bool', ['long', ref.refType(ref.types.void), 'int32']],
  GetWindowThreadProcessId : ['long', ['long', ref.refType(ref.types.CString)]],
});

let pfnWinEventProc = null;
let enumWindowsFunction = null;


enumThreadWindowsFunction = ffi.Callback('bool', ['long', 'int32'], function(hwnd, lParam) {
  const buf = new Buffer(255);
  user32Additional.GetWindowTextA(hwnd, buf, 255);
  const name = ref.readCString(buf, 0);

  if (!!name && (name !== 'Default IME') && (name !== 'MSCTFIME UI')) {
    if (name.includes('PokerStars')) { return true }
    else {
      console.log(`Window name: ${name}`);

      const windowStructure = Buffer.alloc(4 * 4);
      user32.GetWindowRect(hwnd, windowStructure);
      const initialPosition = {
        x: windowStructure.readUInt32LE(0),
        y: windowStructure.readUInt32LE(4) + 40,
        width: windowStructure.readUInt32LE(8) - windowStructure.readUInt32LE(0),
        length: windowStructure.readUInt32LE(12) - windowStructure.readUInt32LE(4) - 40,
      };

      createHudWindow(hwnd, name, initialPosition);
    }
  }

  return true;
});

enumWindowsFunction = ffi.Callback('bool', ['long', 'int32'], function(hwnd, lParam) {
  const buf = new Buffer(255);
  user32Additional.GetWindowTextA(hwnd, buf, 255);
  const name = ref.readCString(buf, 0);
  if (name.includes(`PokerStars`)) {
    const processBuffer = new Buffer(255);
    processBuffer.type = ref.types.int;
    const threadID = user32Additional.GetWindowThreadProcessId(hwnd, processBuffer);
    const processID = ref.deref(processBuffer);
    console.log(`ProcessID: ${processID}, thread ${threadID}`);
    console.log(`Parent Window name: ${name}`);
    user32Additional.EnumThreadWindows(threadID, enumThreadWindowsFunction, 0);
  }
  return true;
});

const hudWindows = [];

createHudWindow = (pointer, name, initialPosition) => {
  const newWindow = new BrowserWindow({
    width: initialPosition.width,
    height: initialPosition.height,
    x: initialPosition.x,
    y: initialPosition.y,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  windows.push({
    jivaroWindowHandle: newWindow.getNativeWindowHandle().readInt32LE(),
    pokerStarsWindowHandle: pointer,
  })
};

const user32 = U.load();

setTimeout(function () {
  const appWindow = user32.GetForegroundWindow();
  user32.EnumWindows(enumWindowsFunction, 0);

  let move = false;
  let foreGroundWindow = user32.GetForegroundWindow();

  const moveFunction = _.throttle(() => {
    const windowPair = windows.find(window => foreGroundWindow === window.pokerStarsWindowHandle);
    console.log(windowPair);

    if (move && windowPair) {
      const strct = Buffer.alloc(4 * 4);
      user32.GetWindowRect(foreGroundWindow, strct);
      user32Additional.SetWindowPos(
        windowPair.jivaroWindowHandle,
        -1,
        strct.readUInt32LE(0),
        strct.readUInt32LE(4) + 40,
        strct.readUInt32LE(8) - strct.readUInt32LE(0),
        strct.readUInt32LE(12) - strct.readUInt32LE(4) - 40,
        0x0010
      );

      user32Additional.SetWindowPos(
        foreGroundWindow,
        windowPair.jivaroWindowHandle,
        strct.readUInt32LE(0),
        strct.readUInt32LE(4),
        strct.readUInt32LE(8) - strct.readUInt32LE(0),
        strct.readUInt32LE(12) - strct.readUInt32LE(4),
        0x0002
      );

      user32Additional.SetWindowPos(
        windowPair.jivaroWindowHandle,
        -2,
        strct.readUInt32LE(0),
        strct.readUInt32LE(4) + 40,
        strct.readUInt32LE(8) - strct.readUInt32LE(0),
        strct.readUInt32LE(12) - strct.readUInt32LE(4) - 40,
        0x0010
      );
    }
    moveFunction();
  }, 10);

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
