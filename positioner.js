// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
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
const { K } = require('win32-api');
const { DTypes } = require('win32-def');
const { DModel } = require('win32-def');
const ffi = require('ffi-napi');
const ref = require('ref-napi');
const windows = [];

const user32Additional = ffi.Library("user32", {
  GetWindowTextLengthW: ["int", ["pointer"]],
  SetWinEventHook: ["int", ["int", "int", "pointer", "pointer", "int", "int", "int"]],
  SetWindowPos: ["int", ["int", "int", "int", "int", "int", "int", "int"]],
  MoveWindow: ["int", ["int", "int", "int", "int", "int", "int"]],
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
      console.log(`Window name: ${hwnd}`);

      const windowStructure = Buffer.alloc(4 * 4);
      user32.GetWindowRect(hwnd, windowStructure);
      const initialPosition = {
        x: windowStructure.readUInt32LE(0),
        y: windowStructure.readUInt32LE(4) + 40,
        width: windowStructure.readUInt32LE(8) - windowStructure.readUInt32LE(0),
        length: windowStructure.readUInt32LE(12) - windowStructure.readUInt32LE(4) - 40,
      };

      setWindow(hwnd, name, initialPosition);
    }
  }

  return true;
});

enumWindowsFunction = ffi.Callback('bool', ['long', 'int32'], function(hwnd, lParam) {
  const buf = new Buffer(255);
  user32Additional.GetWindowTextA(hwnd, buf, 255);
  const name = ref.readCString(buf, 0);
  console.log(hwnd);
  console.log(name);
  if (name.includes(`Calculator`)) {
    console.log(`Window name: ${name}`);
    console.log(`Window name: ${hwnd}`);
    const processBuffer = new Buffer(255);
    processBuffer.type = ref.types.int;
    const threadID = user32Additional.GetWindowThreadProcessId(hwnd, processBuffer);
    const processID = ref.deref(processBuffer);
    console.log(`ProcessID: ${processID}, thread ${threadID}`);
    console.log(`Parent Window name: ${name}`);
    // user32Additional.EnumThreadWindows(threadID, enumThreadWindowsFunction, 0);
  }
  return true;
});

setWindow = (pointer, name, initialPosition) => {
  console.log(pointer);
  const duplicate = windows.find(element => element.pokerStarsWindowHandle === pointer);
  if (!duplicate) {
    windows.push({
      pokerStarsWindowHandle: pointer,
    });
  }
};

setPosition = async (action) => {
  // await user32.EnumWindows(enumWindowsFunction, 0);
  // const windowCount = windows.length;
  // const displays = screen.getAllDisplays();

  let foreGroundWindow = user32.GetForegroundWindow();
  // console.log(foreGroundWindow);

  if (action === 1) {
    let i = 0;
    windows.forEach((windowInstance) => {
      console.log(windowInstance);
      try {
        // const move = user32Additional.MoveWindow(
        //   windowInstance.pokerStarsWindowHandle,
        //   50,
        //   50,
        //   500,
        //   500,
        //   false
        // );

        const move = user32Additional.SetWindowPos(
          windowInstance.pokerStarsWindowHandle,
          // foreGroundWindow,
          0,
          50,
          50,
          null,
          null,
          0x0010 | 0x0200 | 0x0004 | 0x0001
        );

        console.log(move);

        // const buffer = new Buffer(1024);
        // buffer.type = ref.types.CString;
        const dw = kernel32.GetLastError();
        console.log(dw);
        // console.log(kernel32.FormatMessageW(
        //   0x00000100 | 0x00001000 | 0x00000200,
        //   null,
        //   dw,
        //   0x0409,
        //   buffer,
        //   0,
        //   null,
        // ));
        // console.log(move);
        // console.log("-------");
        // console.log(buffer);
        // console.log(ref.deref(buffer));
        // console.log("-------");
      } catch (e) {
        console.log("ERROR");
        console.log(e.message);
      }
    });
  }

  // console.log(displays);
  // console.log(windowCount);
};

const user32 = U.load();
const kernel32 = K.load();

const launchStrip = () => {
  // Create the browser window.

  stripWindow = new BrowserWindow({
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  setInterval(() => {
    setPosition(0);
  }, 5000);

  stripWindow.loadURL(`http://localhost:4242/positioner`);
  stripNode = stripWindow && stripWindow.webContents;
  stripNode = stripWindow && stripWindow.webContents;
  stripNode.on('did-finish-load', () => {
    user32.EnumWindows(enumWindowsFunction, 0);
    ipcMain.on('position', (event, message) => {
      console.log('replay');
      console.log(message);

      if (message.action === 4) {
        app.quit();
      }

      switch (message.action) {
        case 1:
          setPosition(1);
          break;
        case 2:
          setPosition(2);
          break;
        case 3:
          setPosition(3);
          break;
      }
    });
  });

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
