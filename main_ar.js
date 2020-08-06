// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  ipcMain,
} = require('electron');

const Windowslaver = require('./windowslaver.js');

app.disableHardwareAcceleration();


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let stripWindow;
let stripNode;

const pokerThreadId = 56968;

let yellowWindow;
const yellowPSWindow = 462828;

let blueWindow;
const bluePSWindow = 397282;

let windowslaver = new Windowslaver();

console.log = (message) => {
  if (stripNode) {
    stripNode.executeJavaScript(`console.log(${JSON.stringify(message)})`);
  }
};



const launchStrip = async () => {
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
  stripWindow.loadURL('https://app.jivaro.com');
  stripNode = stripWindow && stripWindow.webContents;

  yellowWindow = new BrowserWindow({
    width: 50,
    height: 50,
    frame: false,
    useContentSize: true,
    backgroundColor: "#F7c136",
    transparent: true,
    focusable: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  yellowbuff = yellowWindow.getNativeWindowHandle();

  blueWindow = new BrowserWindow({
    width: 50,
    height: 50,
    frame: false,
    useContentSize: true,
    backgroundColor: "#00FFFF",
    transparent: true,
    focusable: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  bluebuff = blueWindow.getNativeWindowHandle();

  await windowslaver.initialize(pokerThreadId);

  windowslaver.addWindow(yellowPSWindow, yellowbuff.readUInt32LE());
  windowslaver.addWindow(bluePSWindow, bluebuff.readUInt32LE())

  /*
  if (windowslaver.windowPairs.length > 0) {
    windowslaver.windowPairs.forEach(async (window, index) => {
      const newWindow = new BrowserWindow({
        width: 200,
        height: 200,
        frame: false,
        useContentSize: true,
        backgroundColor: "#" + Math.floor(Math.random()*16777215).toString(16),
        transparent: true,
        focusable: false,
        webPreferences: {
          nodeIntegration: true,
        },
      });

      const newWindowHandle = newWindow.getNativeWindowHandle();
      windowslaver.windowPairs[index].jivaroWindow = newWindow;
      windowslaver.windowPairs[index].jivaroWindowHandle = newWindowHandle;

      let num = index;
      let instance = windowslaver.windowPairs[num];
      instance.move = true;
      console.log("start");
      setTimeout(() => {
        console.log("stop");
        instance.move = false;
      }, 200);

      console.log(windowslaver.windowPairs);

    });
  }
*/
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
    launchStrip();
  }, 400);

});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

