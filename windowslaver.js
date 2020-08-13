// const { U } = require('win32-api');
// const { K } = require('win32-api');
// const { DTypes } = require('win32-def');
// const { DModel } = require('win32-def');
const ffi = require('ffi-napi');
const ref = require('ref-napi');
const _ = require('lodash');

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
  ShowWindow: [ 'bool', [ 'int', 'int' ] ],
  SetParent: [ 'int', [ 'int', 'int' ] ],
  SetWindowsHookExA: [ 'int', [ 'int', 'int', 'int', 'int'] ],
});

class Windowslaver {

  #isWindow = (handle) => {
    return user32.IsWindow(handle);
  }

  // Finding all windows which have certain name
  #enumWindowsFunction = (application, lookUpChildrenByThread) => {
    let self = this;
    return ffi.Callback('bool', ['long', 'int32'], function (hwnd, lParam) {
      const buf = new Buffer(256);
      user32.GetWindowTextA(hwnd, buf, 256);
      const name = ref.readCString(buf, 0);
      if (name.includes(application)) {
        console.log("Found window");
        console.log(`Window name: ${name}`);
        console.log(`Window handle: ${hwnd}`);
        const processBuffer = new Buffer(255);
        processBuffer.type = ref.types.int;
        const threadID = user32.GetWindowThreadProcessId(hwnd, processBuffer);
        const processID = ref.deref(processBuffer);
        if (lookUpChildrenByThread) {
          console.log(`Thread ID: ${threadID}`);
          console.log(`Process ID: ${processID}`);
          user32.EnumThreadWindows(threadID, self.#enumThreadWindowsFunction(), 0);
        } else {
          self.addThread(threadID);
          self.addProcess(processID);
          self.addWindow(hwnd, name);
        }
      }
      return true;
    });
  };

  // Finding all windows which share certain Thread ID
  #enumThreadWindowsFunction = () => {
    let self = this;
    return ffi.Callback('bool', ['long', 'int32'], function(hwnd, lParam) {
      const buf = new Buffer(255);
      user32.GetWindowTextA(hwnd, buf, 255);
      const name = ref.readCString(buf, 0);
      // Checking for miscellaneous windows
      if (!!name && (name !== 'Default IME') && (name !== 'MSCTFIME UI')) {
        if (name.includes('PokerStars')) { return true }
        else {
          console.log(`Window name: ${name}`);
          console.log(`Window handle: ${hwnd}`);
          const processBuffer = new Buffer(255);
          processBuffer.type = ref.types.int;
          const threadID = user32.GetWindowThreadProcessId(hwnd, processBuffer);
          const processID = ref.deref(processBuffer);
          self.addThread(threadID);
          self.addProcess(processID);
          self.addWindow(hwnd, name);
        }
      }

      return true;
    });
  };

  #placeOverlayOnApplication = (windowToMove) => {
    let self = this;
    let strct = Buffer.alloc(4 * 4);
    user32.GetWindowRect(windowToMove.applicationHandle, strct);
    const rect = {};
    rect.left = strct.readUInt32LE(0);
    rect.top = strct.readUInt32LE(4);
    rect.right = strct.readUInt32LE(8);
    rect.bottom = strct.readUInt32LE(12);

    // if ((rect.left > 2000000) || (rect.left < -2000000))
    try {
      user32.SetWindowPos(
        windowToMove.jivaroWindowHandle,
        -1, rect.left, rect.top + 40, rect.right - rect.left, rect.bottom - rect.top - 40, null
      );
      user32.SetWindowPos(
        windowToMove.jivaroWindowHandle,
        -2, 0, 0, 0, 0, (0x0001 | 0x0002)
      );
    } catch (e) {
      windowToMove.jivaroWindow.hide();
    }

    windowToMove.move = false;
  };

  #windowReceivedEvent = () => {
    let self = this;
    return (
      ffi.Callback(
        "void",
        ["pointer", "int", "int", "long", "long", "int", "int"],
        function (hWinEventHook, event, hwnd, idObject, idChild, idEventThread, dwmsEventTime) {
          console.log('Handle ' + hwnd + ' receiving event ' + event + ' on thread ' + idEventThread);
          const windowToMove = self.windowPairs.find(item => item.applicationHandle === hwnd);
          if (!!windowToMove) {
            switch (event) {
              case 3: // 0x0003 EVENT_SYSTEM_FOREGROUND
                windowToMove.jivaroWindow.show();
                self.#placeOverlayOnApplication(windowToMove);
                break;
              case 8: // EVENT_SYSTEM_CAPTURESTART
                windowToMove.move = true;
                self.#watcher();
                break;
              case 9: // EVENT_SYSTEM_CAPTUREEND
                self.#placeOverlayOnApplication(windowToMove);
                break;
              case 10: // EVENT_SYSTEM_MOVESIZESTART
                windowToMove.move = true;
                self.#watcher();
                break;
              case 11: // EVENT_SYSTEM_MOVESIZEEND
                self.#placeOverlayOnApplication(windowToMove);
                break;
              case 22: // 0x0016 EVENT_SYSTEM_MINIMIZESTART
                windowToMove.jivaroWindow.hide();
                break;
              case 23: // 0x0017 EVENT_SYSTEM_MINIMIZEEND
                windowToMove.jivaroWindow.show();
                // self.#placeOverlayOnApplication(windowToMove);
                break;
              default:
              console.log(event);
            }
          }
        }
      )
    );
  };

  #windowReceivedEventInstance = null;

  #watcher = _.throttle(() => {
    // console.log("watching");
    const windowToMove = this.windowPairs.find(windowInstance => !!windowInstance.move);
    if (!!windowToMove) {
      const windowRectangle = Buffer.alloc(4 * 4);
      user32.GetWindowRect(windowToMove.applicationHandle, windowRectangle);
      const jivaroWindowRectangle = {
        left: windowRectangle.readUInt32LE(0),
        top: windowRectangle.readUInt32LE(4),
        right: windowRectangle.readUInt32LE(8),
        bottom: windowRectangle.readUInt32LE(12),
      };

      try {
        user32.SetWindowPos(
          windowToMove.jivaroWindowHandle,
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

      this.#watcher();
    }
  }, 5);

  #keeper = _.throttle(() => {
    console.log("keeping");
    this.windowPairs.forEach((windowToMove) => {
      try {
        const prevHandle = user32.GetWindow(windowToMove.applicationHandle, 3);
        user32.SetWindowPos(
          windowToMove.jivaroWindowHandle,
          windowToMove.applicationHandle === prevHandle ? -2 : prevHandle,
          0, 0, 0, 0, 0x0002 | 0x0001 | 0x4000 | 0x0010);
      } catch (e) {
        console.log("Positioning error");
      }
    });
    this.#keeper();
  }, 25);

  constructor() {
    console.log('initializing windowslaver');
    this.windowPairs = [];
    this.threads = [];
    this.processes = [];
    this.callbacks = [];
    this.application = "PokerStars";
  }

  async initialize() {
    console.log("Enumerating windows");

    try {
      await user32.EnumWindows(this.#enumWindowsFunction(this.application, true), 0)
    } catch (e) {
      console.log("Enum error");
    }

    if (this.processes.length > 0) {
      this.#windowReceivedEventInstance = this.#windowReceivedEvent();
      this.processes.forEach(async (process, index) => {
        await this.addCallback
        try {
          user32.SetWinEventHook(0x0000, 0x00FF, null, this.#windowReceivedEventInstance, process, 0, 0 | 2);
        } catch (e) {
          console.log("WinHook error");
        }
      })
    }

    // this.#watcher();
    this.#keeper();
  }

  addWindow(hwnd, name) {
    console.log("Adding aplication window");
    this.windowPairs.push({
      applicationHandle: hwnd,
      applicationName: name,
    });
  };

  addJivaroWindow(newWindow, newWindowHandle, handle) {
    console.log("Adding Jivaro aplication window");
    const window = this.windowPairs.find(item => item.applicationHandle === handle);
    window.jivaroWindow = newWindow;
    window.jivaroWindowHandle = newWindowHandle;

    // Set parentage
    // user32.SetWindowLongPtrA(window.jivaroWindowHandle, -8, window.applicationHandle);
    // user32.PostMessageA(window.applicationHandle, 0x112, 0xF120, 0x0);

    let strct = Buffer.alloc(4 * 4);
    user32.GetWindowRect(window.applicationHandle, strct);

    let rect = {};
    rect.left = strct.readUInt32LE(0);
    rect.top = strct.readUInt32LE(4);
    rect.right = strct.readUInt32LE(8);
    rect.bottom = strct.readUInt32LE(12);

    try {
      const prevHandle = user32.GetWindow(window.applicationHandle, 3); // GW_HWNDPREV
      console.log(prevHandle === handle);
      console.log(prevHandle);
      console.log("positioning", window.applicationHandle === prevHandle ? -2 : prevHandle);
      user32.SetWindowPos(window.jivaroWindowHandle, 1, rect.left, rect.top + 40, rect.right - rect.left, rect.bottom - rect.top - 40, 0x0010); // SWP_ASYNCWINDOWPOS | SWP_SHOWWINDOW
    } catch (e) {
      console.log("Host window is hidden");
      newWindow.hide();
    }
  }

  addThread(id) {
    this.threads.push(id);
  };

  addProcess(id) {
    this.processes.push(id);
  };
}


module.exports = Windowslaver;
