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
});

const slaveHandles = [];
let windowProc = null;

class Windowslaver {

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

  #windowReceivedEvent = () => {
    let self = this;
    return (
      ffi.Callback(
        "void",
        ["pointer", "int", "int", "long", "long", "int", "int"],
        function (hWinEventHook, event, hwnd, idObject, idChild, idEventThread, dwmsEventTime) {
          console.log(self);
          console.log('Moves');
          console.log('Handle ' + hwnd + ' receiving event ' + event + ' on thread ' + idEventThread);

          if (self.windowPairs.length > 0) {
            const windowToMove = self.windowPairs.find(item => item.applicationHandle === hwnd);
            console.log(windowToMove);

            switch (event) {
                case 10:
                    windowToMove.move = true;
                    break;
                case 11:
                    user32.SetWindowPos(
                      windowToMove.jivaroWindowHandle.readInt32LE(),
                      -2,
                      0,
                      0,
                      0,
                      0,
                      (0x0001 | 0x0002)
                    );
                    windowToMove.move = false;
                    break;
                default:
                    windowToMove.move = false;
            }
          }
        }
      )
    );
  };

  #windowReceivedEventInstance = null;

    #watcher = _.throttle(() => {
        console.log("watching");
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
                  windowToMove.jivaroWindowHandle.readInt32LE(),
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
        }

        this.#watcher();
    }, 10);

  constructor() {
    console.log('initializing windowslaver');
    this.windowPairs = [];
    this.threads = [];
    this.processes = [];
    this.callbacks = [];
    this.application = "Calculator";
  }

  async initialize() {
    console.log("Enumerating windows");

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
          user32.SetWinEventHook(10, 11, null, this.#windowReceivedEventInstance, process, 0, 0 | 2)
        } catch (e) {
          console.log("WinHook error");
        }
      })
    }

    this.#watcher();
  }



  addWindow(hwnd, name) {
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


  removeHandle(handle) {
    console.log('removeHandle');
    if (slaveHandles.some(e => e.handle === handle)) {
      console.log('Removing handle ' + handle);
      slaveHandles.splice(slaveHandles.findIndex(e => e.handle === handle), 1);
      // unhook
    } else {
      console.log('Removal issued for untracked handle ' + handle);
      // ?
    }
  }

}

module.exports = Windowslaver;
