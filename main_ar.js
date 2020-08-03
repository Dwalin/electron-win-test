// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  ipcMain,
} = require('electron');

// app.commandLine.appendSwitch("disable-gpu");
// app.commandLine.appendArgument("disable-gpu");

app.disableHardwareAcceleration();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let stripWindow;
let stripNode;

console.log = (message) => {
  if (stripNode) {
    // stripNode.executeJavaScript(`console.log("console.log from electron")`);
    stripNode.executeJavaScript(`console.log(${JSON.stringify(message)})`);
  }
};

const Windowslaver = require('./windowslaver.js');

let yellowWindow;
const yellowOverlay = 526984;
let yellowMovekey = 0;
let blueWindow;
const blueOverlay = 69106;
let blueMoveKey = 0;

const ffi = require('ffi-napi');
const ref = require('ref-napi');

let windowslaver = new Windowslaver();

var user32 = new ffi.Library('user32', {
  'GetForegroundWindow' : [ 'uint32', [] ],
  'GetWindowRect' : [ 'bool', [ 'int', 'pointer'] ],
  'SetWindowPos' : [ 'bool', [ 'int32', 'int32', 'int32', 'int32', 'int32', 'int32', 'int32' ] ],
  'ShowWindow' : [ 'bool', [ 'int32', 'int32' ] ],
  'PostMessageA' : [ 'bool', [ 'int32', 'int32', 'int32', 'int32' ] ],
  'SetWindowLongPtrA' : [ 'int32', [ 'int32', 'int32', 'int32' ] ]
});


const func = () => {
  windowslaver.iterated();
}

const launchStrip = () => {
  // Create the browser window.

  stripWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    useContentSize: true,
    // alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  yellowWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    // frame: false,
    // useContentSize: true,
    backgroundColor: "#F7c136",
    // transparent: true,
    // focusable: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  yellowbuff = yellowWindow.getNativeWindowHandle();

  windowslaver.addHandle(yellowOverlay, yellowbuff.readUInt32LE());
  stripWindow.loadURL('https://app.jivaro.com');
  stripNode = stripWindow && stripWindow.webContents;

  setInterval(() => {
    windowslaver.iterated();
  }, 1000);

  // Emitted when the window is closed.
  stripWindow.on('closed', () => {
    stripNode = null;
    stripWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  setTimeout(() => {
    // if (process.platform === 'win32') {
    //   app.setAsDefaultProtocolClient('jivaro', process.execPath, [
    //     path.resolve(process.argv[1] || ''),
    //   ]);
    //
    //   // app.setAsDefaultProtocolClient('jivaro');
    // } else {
    //   app.setAsDefaultProtocolClient('jivaro');
    // }

    launchStrip();
  }, 400);

});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  // if (stripWindow === null) launchStrip();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
