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

var FFILA = require('ffi-napi');
var REF = require('ref-napi');

var user32IsWindow = new FFILA.Library('user32', {
  'IsWindow' : [
    'BOOL', [ 'int32' ]
  ]
});


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

  stripWindow.loadURL('https://app.jivaro.com');
  stripNode = stripWindow && stripWindow.webContents;

  console.log("I LIKE TURTLES");

  const res = user32IsWindow.IsWindow(2232174);
  console.log(res);

  // const res = REF.alloc(32);
  // var dres = res.deref();
  //
  // if (dres == 0) console.log("NOT A WINDOW");
  // if (dres == 1) console.log("IS A WINDOW");
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
