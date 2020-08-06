// const { U } = require('win32-api');
// const { K } = require('win32-api');
// const { DTypes } = require('win32-def');
// const { DModel } = require('win32-def');
const ffi = require('ffi-napi');
const ref = require('ref-napi');
const  _ = require('lodash');
const windows = [];

const user32 = ffi.Library("user32", {
  GetWindowTextLengthW: ["int", ["pointer"]],
  SetWinEventHook: ["int", ["int", "int", "pointer", "pointer", "int", "int", "int"]],
  SetWindowPos: ["int", ["int", "int", "int", "int", "int", "int", "int"]],
  MoveWindow: ["int", ["int", "int", "int", "int", "int", "int"]],
  GetWindowTextA: ['long', ['long', ref.refType(ref.types.CString), 'long']],
  SetWindowTextA: ['long', ['long', ref.refType(ref.types.CString)]],
  EnumWindows: ['bool', [ref.refType(ref.types.void), 'int32']],
  EnumChildWindows: ['bool', ['long', ref.refType(ref.types.void), 'int32']],
  EnumThreadWindows: ['bool', ['long', ref.refType(ref.types.void), 'int32']],
  GetWindowThreadProcessId: ['long', ['long', ref.refType(ref.types.CString)]],
  GetWindowRect: ['bool', ['int', 'pointer']],

  IsWindow: ['bool', [ 'int' ]],
  SetWindowLongPtrA: [ 'int', [ 'int', 'int', 'int' ] ],
  GetWindow: [ 'int', [ 'int', 'int'] ],
  PostMessageA: [ 'bool', [ 'int', 'int', 'int', 'int' ] ],
  ShowWindow: [ 'bool', [ 'int', 'int' ] ]
});

class SlavePair {

  constructor(handle, overlay) {

    this.handle = handle;
    this.overlay = overlay;
    // What else do we need to remeber between states?
    this.state = 0; // 0 Hidden 1 Shown 2 Moving
    this.trigger = false;
  }
}

class Windowslaver {

  #isWindow = (handle) => {
    return user32.IsWindow(handle);
  }

  /*
  #enumWindowsFunction = (application, lookUpChildrenByThread) => {
    let self = this;
    return ffi.Callback('bool', ['long', 'int32'], function (hwnd, lParam) {
      const buf = new Buffer(256);
      user32.GetWindowTextA(hwnd, buf, 256);
      const name = ref.readCString(buf, 0);
      if (name.includes(application)) {
        console.log(hwnd);
        const processBuffer = new Buffer(255);
        processBuffer.type = ref.types.int;
        const threadID = user32.GetWindowThreadProcessId(hwnd, processBuffer);
        const processID = ref.deref(processBuffer);
        self.addThread(threadID);
        self.addProcess(processID);
        if (lookUpChildrenByThread) {
          user32.EnumThreadWindows(threadID, this.enumThreadWindowsFunction, 0);
        } else {
          self.addWindow(hwnd, name);
        }
      }
      return true;
    });
  };
  */

  #windowReceivedEvent = () => {
    let self = this;
    return (
      ffi.Callback(
        "void",
        ["pointer", "int", "int", "long", "long", "int", "int"],
        function (hWinEventHook, event, hwnd, idObject, idChild, idEventThread, dwmsEventTime) {
          console.log(self);

          console.log('Handle ' + hwnd + ' receiving event ' + event + ' on thread ' + idEventThread);

          let wndw = self.slavePairs.find(e => e.handle === hwnd);
          console.log('Handle from pair is ' + wndw.handle);

          // NULL CHECK

          switch(event) {
            case 3: { // 0x0003 EVENT_SYSTEM_FOREGROUND
              wndw.state = 1;
            }
              break;
            case 8: { // 0x0008 EVENT_SYSTEM_CAPTURESTART
              wndw.state = 2;
            }
              break;
            case 9: { // 0x0009 EVENT_SYSTEM_CAPTUREEND
              wndw.state = 1;
            }
              break;
            case 10: { //0x000A EVENT_SYSTEM_MOVESIZESTART
              wndw.state = 2;
            }
              break;
            case 11: { //0x000B EVENT_SYSTEM_MOVESIZEEND
              wndw.state = 1;
            }
              break;
            case 22: { // 0x0016 EVENT_SYSTEM_MINIMIZESTART
              wndw.state = 0;
              wndw.trigger = true;
            }
              break;
            case 23: { // 0x0017 EVENT_SYSTEM_MINIMIZEEND
              wndw.state = 1;
              wndw.trigger = true;
            }
              break;
            case 25: { // 0x8019 EVENT_OBJECT_LIVEREGIONCHANGED (THINK)
            }
              break;
            default:
              console.log(event);
          }

          /*
            3 - 0x0003 EVENT_SYSTEM_FOREGROUND
            8 - 0x0008 EVENT_SYSTEM_CAPTURESTART
            9 - 0x0009 EVENT_SYSTEM_CAPTUREEND
            10 - 0x000A EVENT_SYSTEM_MOVESIZESTART
            11 - 0x000B EVENT_SYSTEM_MOVESIZEEND
            22 - 0x0016 EVENT_SYSTEM_MINIMIZESTART
            23 - 0x0017 EVENT_SYSTEM_MINIMIZEEND
            25 - 0x8019 EVENT_OBJECT_LIVEREGIONCHANGED (THINK)

          */
        }
      )
    );
  };

  #windowReceivedEventInstance = null;

  #watcher = _.throttle(() => {
    //console.log("watching");
    this.slavePairs.forEach( function(item, index) {

      switch(item.state) {
        case 0: { // Hidden
          console.log('state 0');
          if(item.trigger) {
            let minimize = user32.ShowWindow(item.overlay, 6); // SW_MINIMIZE -> 11 SW_FORCEMINIMIZE
            console.log('Minimizing returned ' + minimize);
            item.trigger = false;
          }
        }
          break;
        case 1: { // Shown
          console.log('state 1');
          if(item.trigger) {
            let restore = user32.ShowWindow(item.overlay, 9); // SW_RESTORE
            console.log('Restore returned ' + restore);
            item.trigger = false;
          }
        }
          break;
        case 2: { // Moving
          console.log('state 2');
          let strct = Buffer.alloc(4 * 4);
          let rectQuery = user32.GetWindowRect(item.handle, strct);

          let rect = {};
          rect.left = strct.readUInt32LE(0);
          rect.top = strct.readUInt32LE(4);
          rect.right = strct.readUInt32LE(8);
          rect.bottom = strct.readUInt32LE(12);

          let prevHandle = user32.GetWindow(item.handle, 3); // GW_HWNDPREV
          console.log('handle ' + item.handle + ' prevHandle ' + prevHandle);

          let pos = user32.SetWindowPos(item.overlay, prevHandle, rect.left, rect.top + 40, rect.right - rect.left, rect.bottom - rect.top - 40, 0x0040); // SWP_SHOWWINDOW
          console.log('initPos returned ' + pos);
        }
          break;
        default: {
        }
          break;
      }
    });
    /*
      const windowToMove = this.windowPairs.find(windowInstance => !!windowInstance.move);
      if (!!windowToMove) {
          this.windowPairs.forEach((pair) => {
              if (!!pair.move) {
                  const windowRectangle = Buffer.alloc(4 * 4);
                  user32.GetWindowRect(pair.applicationHandle, windowRectangle);
                  const jivaroWindowRectangle = {
                      left: windowRectangle.readUInt32LE(0),
                      top: windowRectangle.readUInt32LE(4),
                      right: windowRectangle.readUInt32LE(8),
                      bottom: windowRectangle.readUInt32LE(12),
                  };

                  try {
                      user32.SetWindowPos(
                        pair.jivaroWindowHandle.readInt32LE(),
                        -1,
                        jivaroWindowRectangle.left,
                        jivaroWindowRectangle.top + 40,
                        jivaroWindowRectangle.right - jivaroWindowRectangle.left,
                        jivaroWindowRectangle.bottom - jivaroWindowRectangle.top - 40,
                        (0x0040)
                      );
                  } catch (e) {
                      console.log("Positioning error");
                  }
              } else {
                  user32.SetWindowPos(
                    windowToMove.jivaroWindowHandle.readInt32LE(),
                    -2,
                    0,
                    0,
                    0,
                    0,
                    (0x0001 | 0x0002)
                  );
              }
          });
      }
  */
    this.#watcher();
  }, 25);


  constructor() {
    console.log('Starting windowslaver');
    this.slavePairs = [];
    this.threadId = 0;
  }

  async initialize(threadId) {
    console.log("Initializing winowslaver...");
    this.threadId = threadId;

    // TODO NULL and > 0 CHECKS

    try {

      this.#windowReceivedEventInstance = this.#windowReceivedEvent();
      user32.SetWinEventHook(0x0000, 0x00FF, null, this.#windowReceivedEventInstance, this.threadId, 0, 0 | 2);
      console.log('Hooks deployed');
    }
    catch(e) {

      console.log('Fail to setup hooks, aborting...');
    }

    /*
    try {
      await user32.EnumWindows(this.#enumWindowsFunction(this.application, false), 0)
    } catch (e) {
      console.log("Enum error");
    }

    console.log(this.processes);
    if (this.processes.length > 0) {
      this.#windowReceivedEventInstance = this.#windowReceivedEvent();
      this.processes.forEach(async (process, index) => {
        await this.addCallback
        try {
          user32.SetWinEventHook(0x0000, 0x00FF, null, this.#windowReceivedEventInstance, process, 0, 0 | 2);
          // user32.SetWinEventHook(0x8013, 0x8013, null, this.#windowReceivedEventInstance, process, 0, 0 | 2);
        } catch (e) {
          console.log("WinHook error");
        }
      })
    }
    */
    this.#watcher();

  }

  addWindow(handle, overlay) {

    if(this.slavePairs.some(e => e.handle === handle)) {

      console.log('Inclusion issued for already tracked handle ' + handle);
    }
    else {

      if(this.#isWindow(handle) === false) {
        console.log(handle + ' is not a window, returning...');
        //return;
      }

      console.log('Adding handle ' + handle);

      // Not guaranteed to succeed due to ? (prob initialization?)
      let parentage = user32.SetWindowLongPtrA(overlay, -6, handle);
      console.log('parentage returned ' + parentage);

      let restore = user32.PostMessageA(handle, 0x112, 0xF120, 0x0); // WM_SYSCOMMAND, SC_RESTORE, 0X0
      console.log('restore returned ' + restore);

      let strct = Buffer.alloc(4 * 4);
      let rectQuery = user32.GetWindowRect(handle, strct);

      let rect = {};
      rect.left = strct.readUInt32LE(0);
      rect.top = strct.readUInt32LE(4);
      rect.right = strct.readUInt32LE(8);
      rect.bottom = strct.readUInt32LE(12);

      let prevHandle = user32.GetWindow(handle, 3); // GW_HWNDPREV
      console.log('handle ' + handle + ' prevHandle ' + prevHandle);


      if (handle === prevHandle) {
        let initPos = user32.SetWindowPos(overlay, -2, rect.left, rect.top + 40, rect.right - rect.left, rect.bottom - rect.top - 40, (0x4000 | 0x0040)); // SWP_ASYNCWINDOWPOS | SWP_SHOWWINDOW
        let initPos = user32.SetWindowPos(overlay, -1, rect.left, rect.top + 40, rect.right - rect.left, rect.bottom - rect.top - 40, (0x4000 | 0x0040)); // SWP_ASYNCWINDOWPOS | SWP_SHOWWINDOW
      }

      let initPos = user32.SetWindowPos(overlay, prevHandle, rect.left, rect.top + 40, rect.right - rect.left, rect.bottom - rect.top - 40, (0x4000 | 0x0040)); // SWP_ASYNCWINDOWPOS | SWP_SHOWWINDOW
      console.log('initPos returned ' + initPos);

      let slave = new SlavePair(handle, overlay /*, hookproc */);
      this.slavePairs.push(slave);
    }
  }
  /*
  addWindow2(hwnd, name) {

    this.windowPairs.push({
      applicationHandle: hwnd,
      applicationName: name,
    });
  };

  addThread(id) {
    this.threads.push(id);
  };

  addProcess(id) {
    this.processes.push(id);
  };

  // addCallback() {
  //     this.callback = '';
  // };

  enumThreadWindowsFunction(application, lookUpchildrenByThread) {
    return ffi.Callback('bool', ['long', 'int32'], function (hwnd, lParam) {
      const buf = new Buffer(255);
      user32.GetWindowTextA(hwnd, buf, 255);
      const name = ref.readCString(buf, 0);
      if (!!name && (name !== 'Default IME') && (name !== 'MSCTFIME UI')) {
        if (name.includes('PokerStars')) {
          return true
        } else {
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
  }
  */

  removeHandle(handle) {
    console.log('removeHandle');
    if (this.slavePairs.some(e => e.handle === handle)) {
      console.log('Removing handle ' + handle);
      this.slavePairs.splice(this.slavePairs.findIndex(e => e.handle === handle), 1);
      // unhook
    } else {
      console.log('Removal issued for untracked handle ' + handle);
      // ?
    }
  }

}

module.exports = Windowslaver;
