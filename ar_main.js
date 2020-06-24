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

let yellowWindow;
const yellowOverlay = 2296624;
let yellowMovekey = 0;
let blueWindow;
const blueOverlay = 526236;
let blueMoveKey = 0;

const ffi = require('ffi-napi');
const ref = require('ref-napi');

var user32 = new ffi.Library('user32', {
  'GetForegroundWindow' : [ 'uint32', [] ],
  'GetWindowRect' : [ 'bool', [ 'int', 'pointer'] ],
  'SetWindowPos' : [ 'bool', [ 'int32', 'int32', 'int32', 'int32', 'int32', 'int32', 'int32' ] ],
  'ShowWindow' : [ 'bool', [ 'int32', 'int32' ] ],
  'PostMessageA' : [ 'bool', [ 'int32', 'int32', 'int32', 'int32' ] ],
  'SetWindowLongPtrA' : [ 'int32', [ 'int32', 'int32', 'int32' ] ]
});


const func = () => {

  console.log('I Like Zeebras');


  var strct = Buffer.alloc(4 * 4);
  //const appWindow = user32.GetForegroundWindow();
  //console.log(appWindow);
  var ret = user32.GetWindowRect(yellowOverlay, strct);
  console.log('getwindowrect : ' + ret);
  if( strct.readUInt32LE(0) != yellowMovekey ) {
    console.log('update');
    let rect = {};
    rect.left = strct.readUInt32LE(0);
    rect.top = strct.readUInt32LE(4);
    rect.right = strct.readUInt32LE(8);
    rect.bottom = strct.readUInt32LE(12);
    yellowbuff = yellowWindow.getNativeWindowHandle();
    console.log('yellow window native handle: ' + yellowbuff.readUInt32LE());
    //var ret3 = user32.PostMessageA(yellowbuff.readUInt32LE(), 274, 61728, 0);
    //console.log(ret3);
    var ret2 = user32.SetWindowPos(yellowbuff.readUInt32LE(), yellowOverlay, rect.left, rect.top + 40, rect.right - rect.left, rect.bottom - rect.top - 40, 0x10);
    console.log('windowpos : ' + ret2);
    yellowMovekey = rect.left;

    var ret3 = user32.PostMessageA(yellowbuff.readUInt32LE(), 0x112, 0xF120, 0x0); // WM_SYSCOMMAND, SC_RESTORE, 0X0
    console.log(' restore : ' + ret3);

    var ret4 = user32.SetWindowLongPtrA(yellowbuff.readUInt32LE(), -8, yellowOverlay);
    console.log('setlongptr : ' + ret4);
  }

  var strct1 = Buffer.alloc(4 * 4);
  var ret1 = user32.GetWindowRect(blueOverlay, strct1);
  console.log('getwindowrect1 : ' + ret);
  if( strct1.readUInt32LE(0) != blueMoveKey ) {
    console.log('update1');
    let rect = {};
    rect.left = strct1.readUInt32LE(0);
    rect.top = strct1.readUInt32LE(4);
    rect.right = strct1.readUInt32LE(8);
    rect.bottom = strct1.readUInt32LE(12);
    bluebuff = blueWindow.getNativeWindowHandle();
    console.log('blue window native handle: ' + bluebuff.readUInt32LE());
    //var ret3 = user32.PostMessageA(yellowbuff.readUInt32LE(), 274, 61728, 0);
    //console.log(ret3);
    var ret22 = user32.SetWindowPos(bluebuff.readUInt32LE(), blueOverlay, rect.left, rect.top + 40, rect.right - rect.left, rect.bottom - rect.top - 40, 0x10);
    console.log('windowpos1 : ' + ret22);
    blueMoveKey = rect.left;

    var ret33 = user32.PostMessageA(bluebuff.readUInt32LE(), 0x112, 0xF120, 0x0); // WM_SYSCOMMAND, SC_RESTORE, 0X0
    console.log(' restore1 : ' + ret33);

    var ret44 = user32.SetWindowLongPtrA(bluebuff.readUInt32LE(), -8, blueOverlay);
    console.log('setlongptr1 : ' + ret44);
  }

  /*
  let rect = {};
  rect.left = strct.readUInt32LE(0);
  rect.top = strct.readUInt32LE(4);
  rect.right = strct.readUInt32LE(8);
  rect.bottom = strct.readUInt32LE(12);
  yellowbuff = yellowWindow.getNativeWindowHandle();
  console.log('yellow window native handle: ' + yellowbuff.readUInt32LE());
  //var ret3 = user32.PostMessageA(yellowbuff.readUInt32LE(), 274, 61728, 0);
  //console.log(ret3);
  var ret2 = user32.SetWindowPos(yellowbuff.readUInt32LE(), yellowOverlay, rect.left, rect.top, rect.right, rect.bottom, 0);
  console.log('windowpos : ' + ret2);
  */
  /*
  var ret3 = user32.ShowWindow(yellowbuff.readUInt32LE(), 9);
  if(!ret3) {
    console.log('first');
  }
  if(!!ret3) {
    console.log('second');
  }
  console.log(ret3);
  */
  //console.log('rect: ' + JSON.stringify(rect));
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
    frame: false,
    useContentSize: true,
    backgroundColor: "#F7c136",
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  yellowbuff = yellowWindow.getNativeWindowHandle();
  //var ret3 = user32.ShowWindow(yellowbuff.readUInt32LE(), 9);
  //var ret3 = user32.PostMessageA(yellowbuff.readUInt32LE(), 274, 61728, 0);
  //console.log(ret3);

  var ret1 = user32.SetWindowLongPtrA(yellowbuff.readUInt32LE(), -8, yellowOverlay);
  console.log('setlongptr : ' + ret1);

  var ret2 = user32.PostMessageA(yellowbuff.readUInt32LE(), 0x112, 0xF120, 0x0); // WM_SYSCOMMAND, SC_RESTORE, 0X0
  console.log(' restore : ' + ret2);

  var ret3 = user32.SetWindowPos(yellowbuff.readUInt32LE(), yellowOverlay, 0, 0, 0, 0, (0x2 | 0x1 | 0x10 | 0x4000 | 0x40)); // SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_ASYNCWINDOWPOS | SWP_SHOWWINDOW
  console.log(' initialpos : ' + ret3);

  blueWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    useContentSize: true,
    backgroundColor: "#00FFFF",
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  bluebuff = blueWindow.getNativeWindowHandle();

  var ret11 = user32.SetWindowLongPtrA(bluebuff.readUInt32LE(), -8, blueOverlay);
  console.log('setlongptr2 : ' + ret11);

  var ret22 = user32.PostMessageA(bluebuff.readUInt32LE(), 0x112, 0xF120, 0x0); // WM_SYSCOMMAND, SC_RESTORE, 0X0
  console.log(' restore2 : ' + ret22);

  var ret33 = user32.SetWindowPos(bluebuff.readUInt32LE(), blueOverlay, 0, 0, 0, 0, (0x2 | 0x1 | 0x10 | 0x4000 | 0x40)); // SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_ASYNCWINDOWPOS | SWP_SHOWWINDOW
  console.log(' initialpos2 : ' + ret33);

  stripWindow.loadURL('https://app.jivaro.com');
  stripNode = stripWindow && stripWindow.webContents;

  setInterval(func, 1000);

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
