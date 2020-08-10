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
    this.state = 1; // 0 Hidden 1 Shown 2 MovingStart 3 MovingEnd
    this.trigger = false;
    this.minTrigger = false;
  }
}

class Windowslaver {

  #isWindow = (handle) => {
    return user32.IsWindow(handle);
  }

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
          if(wndw) {
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
                wndw.state = 3;
                wndw.trigger = true;
                }
                break;
              case 10: { //0x000A EVENT_SYSTEM_MOVESIZESTART
                wndw.state = 2;
                }
                break;
              case 11: { //0x000B EVENT_SYSTEM_MOVESIZEEND
                wndw.state = 3;
                wndw.trigger = true;
                }
                break;
              case 22: { // 0x0016 EVENT_SYSTEM_MINIMIZESTART
                wndw.state = 0;
                wndw.minTrigger = true;
                }
                break;
              case 23: { // 0x0017 EVENT_SYSTEM_MINIMIZEEND
                wndw.state = 4;
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
        }
      )
    );
  };

  #windowReceivedEventInstance = null;

  #windowFocusEvent = () => {
    let self = this;
    return (
      ffi.Callback(
        "void",
        ["pointer", "int", "int", "long", "long", "int", "int"],
        function (hWinEventHook, event, hwnd, idObject, idChild, idEventThread, dwmsEventTime) {

          console.log(self);
          console.log('Handle ' + hwnd + ' receiving event ' + event + ' on thread ' + idEventThread);
          console.log('wiiiiiiiiiin');
          /*
          let wndw = self.slavePairs.find(e => e.handle === hwnd);
          if(wndw) {
            let strct = Buffer.alloc(4 * 4);
            let rectQuery = user32.GetWindowRect(item.handle, strct);

            let rect = {};
            rect.left = strct.readUInt32LE(0);
            rect.top = strct.readUInt32LE(4);
            rect.right = strct.readUInt32LE(8);
            rect.bottom = strct.readUInt32LE(12);

            let prevHandle = user32.GetWindow(item.handle, 3); // GW_HWNDPREV
            console.log('handle ' + item.handle + ' prevHandle ' + prevHandle);
            let pos = user32.SetWindowPos(item.overlay, (prevHandle === item.overlay ? item.handle : prevHandle), rect.left, rect.top + 40, rect.right - rect.left, rect.bottom - rect.top - 40, 0x0040); // SWP_SHOWWINDOW
            console.log('moving pos returned ' + pos);
          }
          */
        }
      )
    );
  };

  #windowFocusEventInstance = null;

  #watcher = _.throttle(() => {
    //console.log("watching");
    this.slavePairs.forEach( function(item, index) {
      let isAction = false;
      switch(item.state) {
        case 0: { // Hidden
          //console.log('state 0');
          if(item.minTrigger) {
            let minimize = user32.ShowWindow(item.overlay, 6); // SW_MINIMIZE -> 11 SW_FORCEMINIMIZE
            console.log('Minimizing returned ' + minimize);
          }
          item.minTrigger = false;
        }
        break;
        case 1: { // Shown
          //console.log('state 1');
          }

        break;
        case 2: { // MovingStart
          /*
          console.log('state 2');
          let strct = Buffer.alloc(4 * 4);
          let rectQuery = user32.GetWindowRect(item.handle, strct);

          let rect = {};
          rect.left = strct.readUInt32LE(0);
          rect.top = strct.readUInt32LE(4);
          rect.right = strct.readUInt32LE(8);
          rect.bottom = strct.readUInt32LE(12);

          //let prevHandle = user32.GetWindow(item.handle, 3); // GW_HWNDPREV
          //console.log('handle ' + item.handle + ' prevHandle ' + prevHandle);
          let pos = user32.SetWindowPos(item.overlay, -1, rect.left, rect.top + 40, rect.right - rect.left, rect.bottom - rect.top - 40, 0x0040); // SWP_SHOWWINDOW
          console.log('moving pos returned ' + pos);
          */
        }
        break;
        case 3: { // Moving
          //console.log('state 2');
          if(item.trigger) {
            let strct = Buffer.alloc(4 * 4);
            let rectQuery = user32.GetWindowRect(item.handle, strct);

            let rect = {};
            rect.left = strct.readUInt32LE(0);
            rect.top = strct.readUInt32LE(4);
            rect.right = strct.readUInt32LE(8);
            rect.bottom = strct.readUInt32LE(12);

            let prevHandle = user32.GetWindow(item.handle, 3); // GW_HWNDPREV
            console.log('handle ' + item.handle + ' prevHandle ' + prevHandle);
            //let pos = user32.SetWindowPos(item.overlay, prevHandle, rect.left, rect.top + 40, rect.right - rect.left, rect.bottom - rect.top - 40, 0x0040); // SWP_SHOWWINDOW
            let pos = user32.SetWindowPos(item.overlay, 0, rect.left, rect.top + 40, rect.right - rect.left, rect.bottom - rect.top - 40, 0x0044); // SWP_SHOWWINDOW
            console.log('moving pos returned ' + pos);
          }
          item.trigger = false;
        }
        break;
        case 4: { // Moving
          //console.log('state 2');
          if(item.MinTrigger) {

            // Not guaranteed to succeed due to ? (prob initialization?)
            let parentage = user32.SetWindowLongPtrA(item.overlay, -8, item.handle);
            console.log('parentage returned ' + parentage);

            let restore = user32.PostMessageA(item.handle, 0x112, 0xF120, 0x0); // WM_SYSCOMMAND, SC_RESTORE, 0X0
            console.log('restore returned ' + restore);

            let strct = Buffer.alloc(4 * 4);
            let rectQuery = user32.GetWindowRect(item.handle, strct);

            let rect = {};
            rect.left = strct.readUInt32LE(0);
            rect.top = strct.readUInt32LE(4);
            rect.right = strct.readUInt32LE(8);
            rect.bottom = strct.readUInt32LE(12);

            let prevHandle = user32.GetWindow(item.handle, 3); // GW_HWNDPREV
            console.log('handle ' + item.handle + ' prevHandle ' + prevHandle);
            //let pos = user32.SetWindowPos(item.overlay, prevHandle, rect.left, rect.top + 40, rect.right - rect.left, rect.bottom - rect.top - 40, 0x0040); // SWP_SHOWWINDOW
            let pos = user32.SetWindowPos(item.overlay, 0, rect.left, rect.top + 40, rect.right - rect.left, rect.bottom - rect.top - 40, 0x0044); // SWP_SHOWWINDOW
            console.log('moving pos returned ' + pos);
          }
          item.minTrigger = false;
        }
        default: {
          //console.log('Default state found with: ' + item.state);
        }
      }


    });

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
      console.log('dag');
      this.#windowReceivedEventInstance = this.#windowReceivedEvent();
      user32.SetWinEventHook(0x0000, 0x00FF, null, this.#windowReceivedEventInstance, this.threadId, 0, 0 | 2);
      //user32.SetWinEventHook(0x0000, 0x00FF, null, this.#windowReceivedEventInstance, 0, this.threadId, 0 | 2);
      this.#windowFocusEventInstance = this.#windowFocusEvent();
      user32.SetWinEventHook(0x8005, 0x8005, null, this.#windowFocusEventInstance, this.threadId, 0, 0 | 2);
      console.log('Hooks deployed');
    }
    catch(e) {

      console.log('Fail to setup hooks, aborting...');
    }

    this.#watcher();

  }

  addWindow(handle, overlay) {

    if(this.slavePairs.some(e => e.handle === handle)) {

      console.log('Inclusion issued for already tracked handle ' + handle);
    }
    else {

      if(this.#isWindow(handle) === false) {
        console.log(handle + ' is not a window, returning...');
        return;
      }

      console.log('Adding handle ' + handle);

      // Not guaranteed to succeed due to ? (prob initialization?)
      let parentage = user32.SetWindowLongPtrA(overlay, -8, handle);
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
