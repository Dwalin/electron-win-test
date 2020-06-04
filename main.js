// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  ipcMain,
} = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const IpcConstructor = require('node-ipc').IPC;
const _ = require('lodash');

const { find, compact } = require('lodash');

global.dirname = '';
global.userDataPath = app.getPath('userData');

// app.commandLine.appendSwitch("disable-gpu");
// app.commandLine.appendArgument("disable-gpu");

app.disableHardwareAcceleration();


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let stripWindow;
let stripNode;
const hudWindows = [];
const dev = !!isDev;1
// const dev = false;

console.log = (message) => {
  if (stripNode) {
    stripNode.executeJavaScript(`console.log("console.log from electron")`);
    stripNode.executeJavaScript(`console.log(${JSON.stringify(message)})`);
  }
};

if (!isDev) {
  // require(path.join(__dirname, 'server/server'));
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    // mainWindow is window created with `new BrowserWindow(params)`
    if (stripWindow) {
      // And use ipc, or promiseIpc to send the command line
      // to the renderer to handle it however we want
      const cmd = find(commandLine, (cmd) => {
        return cmd.indexOf('jivaro://') > -1;
      });
      let actualCommands = cmd.replace('jivaro://', '');
      actualCommands = actualCommands.split('/');
      const socialPath = actualCommands[1];
      const profile = JSON.parse(decodeURIComponent(actualCommands[2]));
      if (profile) {
        if (socialPath === 'fb') {
          console.log('Facebook token:');
        } else if (socialPath === 'gg') {
          console.log('Google token:');
        }
        console.log(profile);

        stripWindow.send('login', profile);
      }

      stripWindow.show();
      stripWindow.restore();
      stripWindow.focus();
    }
  });
}

const rawIPC = new IpcConstructor();
let closeTimeout = {};

const ipcSetup = () => {
  rawIPC.config.id = 'jivaroStrip';
  rawIPC.config.socketRoot = '';
  rawIPC.config.appspace = '';
  rawIPC.config.rawBuffer = true;
  rawIPC.config.encoding = 'utf8';
  rawIPC.config.logger = (message) => {
    if (stripNode) {
      // // stripNode.send('ping', message);
    }
  };

  rawIPC.connectTo('JivaroControlConnection', () => {
    rawIPC.of.JivaroControlConnection.on('data', (data) => {
      if (stripNode) {
        // stripNode.send(
        //   'ping',
        //   `Data from JivaroControlConnection: ${Buffer.from(data)}`
        // );
      }
    });
  });

  rawIPC.connectTo('JivaroLocalServer', () => {
    rawIPC.of.JivaroLocalServer.on('data', (data) => {
      // First we check if we have the strip connection working
      if (stripNode) {
        const message = Buffer.from(data);
        let messageJSON = {};
        let messages = [];
        const messageString = message.toString('utf8');
        // console.log(messageString);

        try {
          messages = messageString.split('}{');

          if (messages.length > 1) {
            messages.forEach((message, index) => {
              stripNode.send('ping', '---- MESSAGE PROBLEM ----');
              stripNode.send('ping', index);
              stripNode.send('ping', message);
              stripNode.send('ping', '---- MESSAGE PROBLEM ----');
              switch (index) {
                case 0:
                  messages[index] = JSON.parse(message + '}');
                  break;
                case messages.length - 1:
                  messages[index] = JSON.parse('{' + message);
                  break;
                default:
                  messages[index] = JSON.parse('{' + message + '}');
                  break;
              }
            });
          } else {
            messages = [JSON.parse(messages)];
          }

          // messageJSON = messageJSON.root ? messageJSON.root : messageJSON;
          // // stripNode.send('ping', 'messageJSON');
        } catch (e) {
          stripNode.send('ping', '---- MESSAGE PROBLEM ----');
          stripNode.send('ping', e);
          stripNode.send('ping', '---- MESSAGE PROBLEM ----');
        }

        stripNode.send('ping', '---- MESSAGE START ----');
        stripNode.send('ping', messages);
        stripNode.send('ping', '---- MESSAGE END ----');

        messages.forEach((message) => {
          // const parsedMessage = JSON.parse(message);
          messageJSON = message.root ? message.root : message;

          if (messageJSON.event && messageJSON.event === 'hud') {
            // const parsedMessage = JSON.parse(message);
            // messageJSON = parsedMessage.root ? parsedMessage.root : parsedMessage;

            stripNode.send('ping', '    ');
            stripNode.send('ping', '.    ');
            stripNode.send('ping', '    ');

            // stripNode.send('ping', '---- MESSAGE START ----');
            // stripNode.send('ping', tables);
            // stripNode.send('ping', hudWindows);
            // stripNode.send('ping', '---- MESSAGE END ----');

            const tables = messageJSON.data;

            if (tables) {
              Object.keys(tables).forEach((tableKey) => {
                const table = tables[tableKey];

                if (!table.table_data) {
                  hudWindows.forEach((windowInstance, index) => {
                    if (
                      (+windowInstance.id === +table.window.handle || +windowInstance.tableKey === +tableKey)
                      && +windowInstance.clientID === +messageJSON.client_id
                    ) {
                      if (!hudWindows[index].zoom) {
                        hudWindows[index].window.destroy();
                        hudWindows.splice(index, 1);
                      } else {
                        closeTimeout[hudWindows[index].id] = true;
                        setTimeout(() => {
                          if (hudWindows[index] && closeTimeout[hudWindows[index].id]) {
                            hudWindows[index].window.destroy();
                            hudWindows.splice(index, 1);
                          }
                        }, 10000);
                      }
                    }
                  });
                  return false;
                }

                let windowShouldUpdate = [];

                if (hudWindows.length > 0) {
                  windowShouldUpdate = hudWindows.filter(
                    (windowInstance) => {

                      if (+windowInstance.clientID === +messageJSON.client_id) {
                        if (table && table.window && +windowInstance.id === +table.window.handle) {
                          return true;
                        }

                        // if (+windowInstance.tableKey === +tableKey) {
                        //   return true;
                        // }
                      }

                      return false;

                    }
                  );
                }

                if (windowShouldUpdate.length !== 0) {
                  if (windowShouldUpdate[0].data) {
                    windowShouldUpdate[0].data = _.merge(
                      windowShouldUpdate[0].data,
                      table
                    );
                  }

                  stripNode.send('ping', '.      ');
                  stripNode.send('ping', '..     ');
                  stripNode.send('ping', '...    ');
                  stripNode.send('ping', windowShouldUpdate[0].data);

                  // Meaning we have a window already
                  try {
                    if (windowShouldUpdate[0].receiveUpdates) {
                      // Sending data to window

                      if (closeTimeout[windowShouldUpdate[0].id]) {
                        closeTimeout[windowShouldUpdate[0].id] = false;
                      }

                      table.key = +tableKey;
                      windowShouldUpdate.tableKey = +tableKey;
                      windowShouldUpdate[0].windowConnector.send(
                        'tableData',
                        windowShouldUpdate[0].data || table
                      );

                      windowShouldUpdate[0].data = null;
                    } else {

                      if (table.seats) {
                        Object.keys(windowShouldUpdate[0].seats).forEach((key) => {
                          if ((table.seats[key] !== undefined) && (table.seats[key] === null)) {
                            delete windowShouldUpdate[0].seats[key];
                          }
                        });
                      }

                      // Saving data in electron temporarly
                      windowShouldUpdate[0].data = _.merge(
                        windowShouldUpdate[0].data,
                        table
                      );
                    }
                  } catch (e) {
                    // stripNode.send('ping', e);
                  }

                } else {
                  // Meaning we have to create a window
                  const newHudWindow = new BrowserWindow({
                    width: 500,
                    height: 500,
                    x: 100,
                    y: 100,
                    accessibleTitle: `${+messageJSON.client_id}_${+table.window.handle}`,
                    frame: false,
                    transparent: true,
                    skipTaskbar: true,
                    webPreferences: {
                      nodeIntegration: true,
                    },
                  });

                  newHudWindow.loadURL(
                    dev
                      ? 'http://localhost:4242/hud'
                      : 'https://app.jivaro.com/hud'
                  );

                  const newInstance = {
                    id: +table.window.handle,
                    tableKey: +tableKey,
                    window: newHudWindow,
                    windowConnector: newHudWindow.webContents,
                    receiveUpdates: false,
                    zoom: !!table.table_data.is_fast_fold,
                    clientID: +messageJSON.client_id,
                    data: table || {},
                  };

                  hudWindows.push(newInstance);

                  const newWindowIndex = hudWindows.length - 1;
                  const messageHandler = [
                    {
                      id: +table.window.handle,
                      handle: newHudWindow.getNativeWindowHandle(),
                    },
                  ];

                  const messageBuffer = Buffer.from(
                    JSON.stringify(messageHandler)
                  );

                  newHudWindow.on('will-resize', (event) => {
                    event.preventDefault();
                  });

                  rawIPC.of.JivaroControlConnection.emit(messageBuffer);

                  newHudWindow.webContents.on('did-finish-load', async () => {
                    table.key = +tableKey;
                    // newHudWindow.webContents.send(
                    //   'tableData',
                    //   hudWindows[newWindowIndex].data
                    // );
                    hudWindows[newWindowIndex].receiveUpdates = true;
                  });
                }
              });
            } else {
              if (tables === undefined) {
                hudWindows.forEach((windowInstance, index) => {
                  if (
                    +windowInstance.clientID === +messageJSON.client_id
                  ) {
                    if (!hudWindows[index].zoom) {
                      hudWindows[index].window.destroy();
                      hudWindows.splice(index, 1);
                    } else {
                      closeTimeout[hudWindows[index].id] = true;
                      setTimeout(() => {
                        if (hudWindows[index] && closeTimeout[hudWindows[index].id]) {
                          hudWindows[index].window.destroy();
                          hudWindows.splice(index, 1);
                        }
                      }, 10000);
                    }
                  }
                });
              }
            }
          } else {

          }
        });

      }
    });
  });
};

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

  // const stripChildWindow = new BrowserWindow({
  //   width: 200,
  //   height: 200,
  //   frame: false,
  //   transparent: false,
  //   parent: stripWindow,
  //   webPreferences: {
  //     nodeIntegration: true,
  //   },
  // });
  //
  // stripChildWindow.loadURL(dev ? 'http://localhost:4242/test' : 'https://test.app.jivaro.com/test');
  //
  // stripWindow.on("move", () => {
  //   let x = 0, y = 0;
  //   x = stripWindow.getPosition()[0];
  //   y = stripWindow.getPosition()[1];
  //   stripChildWindow.setPosition(x, y);
  // });

  // console.log(stripWindow);
  // stripWindow.setIgnoreMouseEvents(true, { forward: true });

  stripWindow.loadURL(dev ? 'http://localhost:4242' : 'https://app.jivaro.com');
  stripNode = stripWindow && stripWindow.webContents;
  stripNode.on('did-finish-load', () => {
    ipcMain.on('user', (event, message) => {
      // stripNode.send('ping', message);
      const messageBuffer = Buffer.from(JSON.stringify(message));
      rawIPC.of.JivaroControlConnection.emit(messageBuffer);
    });

    ipcMain.on('replay', (event, message) => {
      console.log('replay');

      // // stripNode.send('replay', message);
      const { id } = message;

      replayWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        useContentSize: true,
        transparent: true,
        webPreferences: {
          nodeIntegration: true,
        },
      });

      replayWindow.loadURL(
        dev ? `http://localhost:4242/replay/${id}` : `https://app.jivaro.com/replay/${id}`
      );
    });

    ipcMain.on('quit', () => {
      if (stripNode) {
        // stripNode.send('ping', 'quit');
        stripWindow.close();
      }
      hudWindows.forEach((window) => {
        try {
          window.window.close();
        } catch (e) {
          console.log(e);
        }
      });
      app.quit();
    });
  });

  // Emitted when the window is closed.
  stripWindow.on('closed', () => {
    hudWindows.forEach((window) => {
      if (window && window.window) {
        window.window.close();
      }
    });
    stripNode = null;
    stripWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  setTimeout(() => {
    if (process.platform === 'win32') {
      app.setAsDefaultProtocolClient('jivaro', process.execPath, [
        path.resolve(process.argv[1] || ''),
      ]);

      // app.setAsDefaultProtocolClient('jivaro');
    } else {
      app.setAsDefaultProtocolClient('jivaro');
    }

    launchStrip();
    ipcSetup();
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
