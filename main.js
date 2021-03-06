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

let yellowWindow;
const yellowPSWindow = 393876;

let windowslaver = new Windowslaver();

console.log = (message) => {
  if (stripNode) {
    stripNode.executeJavaScript(`console.log(${JSON.stringify(message)})`);
  }
};


const func = () => {
  //windowslaver.iterated();
  console.log('I Like Zeebras');
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

  await windowslaver.initialize();

  if (windowslaver.windowPairs.length > 0) {
    windowslaver.windowPairs.forEach(async (window, index) => {
      const newWindow = new BrowserWindow({
        width: 200,
        height: 200,
        frame: false,
        useContentSize: true,
        // backgroundColor: "#" + Math.floor(Math.random()*16777215).toString(16),
        transparent: true,
        focusable: false,
        webPreferences: {
          nodeIntegration: true,
        },
      });

      const newWindowHandle = await newWindow.getNativeWindowHandle().readInt32LE();
      await newWindow.loadURL("https://app.jivaro.com/extension");

      // console.log(newWindow, newWindowHandle, window.applicationHandle);
      setTimeout(() => {
        windowslaver.addJivaroWindow(newWindow, newWindowHandle, window.applicationHandle);
      }, 100);
    });
  }

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

