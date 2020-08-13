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
  ShowWindow: [ 'bool', [ 'int', 'int' ] ],
  SetParent: [ 'int', [ 'int', 'int' ] ],
  SetWindowsHookExA: [ 'int', [ 'int', 'int', 'int', 'int'] ]
});

class SlavePair {

  constructor(handle, overlay) {
    this.handle = handle;
    this.overlay = overlay;
  }
}

class Windowslaver {

  #isWindow = (handle) => {
    return user32.IsWindow(handle);
  }

  #windowForwardEvent = () => {
    let self = this;
    return (
      ffi.Callback(
        "void",
        ["pointer", "int", "int", "long", "long", "int", "int"],
        function (hWinEventHook, event, hwnd, idObject, idChild, idEventThread, dwmsEventTime) {

          console.log(self);
          console.log('Handle ' + hwnd + ' receiving event ' + event + ' on thread ' + idEventThread);
          console.log('ooooookayyyy');
          let wndw = self.slavePairs.find(e => e.overlay === hwnd);
          if(wndw) {

            console.log('Event ' + event + ' for handle from pair is ' + wndw.overlay);

          }
          else {
            console.log('unknown handle');
          }
        }
      )
    );
  };

  #windowForwardEventInstance = null;

  #windowReceivedEvent = () => {
    let self = this;
    return (
      ffi.Callback(
        "void",
        ["pointer", "int", "int", "long", "long", "int", "int"],
        function (hWinEventHook, event, hwnd, idObject, idChild, idEventThread, dwmsEventTime) {

          //console.log(self);
          //console.log('Handle ' + hwnd + ' receiving event ' + event + ' on thread ' + idEventThread);

          let wndw = self.slavePairs.find(e => e.handle === hwnd);
          if(wndw) {

            console.log('Event ' + event + ' for handle from pair is ' + wndw.handle);

            switch(event) {
              case 3: { // 0x0003 EVENT_SYSTEM_FOREGROUND

                }
                break;
              case 8: { // 0x0008 EVENT_SYSTEM_CAPTURESTART

                }
                break;
              case 9: { // 0x0009 EVENT_SYSTEM_CAPTUREEND

                let strct = Buffer.alloc(4 * 4);
                let rectQuery = user32.GetWindowRect(wndw.handle, strct);

                let rect = {};
                rect.left = strct.readUInt32LE(0);
                rect.top = strct.readUInt32LE(4);
                rect.right = strct.readUInt32LE(8);
                rect.bottom = strct.readUInt32LE(12);

                if( rect.left > 2140000000 ) return;

                let pos = user32.SetWindowPos(wndw.overlay, 0, rect.left, rect.top + 40, rect.right - rect.left, rect.bottom - rect.top - 40, 0x0044); // SWP_SHOWWINDOW
                console.log('captureend pos returned ' + pos);

                }
                break;
              case 10: { //0x000A EVENT_SYSTEM_MOVESIZESTART

                }
                break;
              case 11: { //0x000B EVENT_SYSTEM_MOVESIZEEND

                let strct = Buffer.alloc(4 * 4);
                let rectQuery = user32.GetWindowRect(wndw.handle, strct);

                let rect = {};
                rect.left = strct.readUInt32LE(0);
                rect.top = strct.readUInt32LE(4);
                rect.right = strct.readUInt32LE(8);
                rect.bottom = strct.readUInt32LE(12);

                if( rect.left > 2140000000 ) return;

                let pos = user32.SetWindowPos(wndw.overlay, 0, rect.left, rect.top + 40, rect.right - rect.left, rect.bottom - rect.top - 40, 0x0044); // SWP_SHOWWINDOW
                console.log('moveend pos returned ' + pos);

                }

                break;
              case 22: { // 0x0016 EVENT_SYSTEM_MINIMIZESTART

                let minimize = user32.ShowWindow(wndw.overlay, 0); // SW_HIDE
                console.log('Minimizing returned ' + minimize);

                }
                break;
              case 23: { // 0x0017 EVENT_SYSTEM_MINIMIZEEND

                let minimize = user32.ShowWindow(wndw.overlay, 5); // SW_SHOW
                console.log('Maximizing returned ' + minimize);

                }
                break;
              case 25: { // 0x8019 EVENT_OBJECT_LIVEREGIONCHANGED (THINK)

                }
                break;
              case 32778: { // 0x800A EVENT_OBJECT_STATECHANGE

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
          else {
            console.log('unknown handle');
          }
        }
      )
    );
  };

  #windowReceivedEventInstance = null;

  constructor(processId) {
    console.log('Starting windowslaver');
    this.slavePairs = [];
    this.threadId = 0;
    this.processId = processId;
  }

  async initialize(threadId) {
    console.log("Initializing winowslaver...");

    if( threadId < 1 ) {
      console.log('invalid threadId, aborting hooking setup');
      return;
    }

    this.threadId = threadId;

    try {

      this.#windowReceivedEventInstance = this.#windowReceivedEvent();
      user32.SetWinEventHook(0x00000000, 0x000000FF, null, this.#windowReceivedEventInstance, this.threadId, 0, 0 | 2);

      this.#windowForwardEventInstance = this.#windowForwardEvent();
      user32.SetWindowsHookExA(7, this.#windowForwardEventInstance, 0, this.processId);
      console.log('Hooks deployed');


    }
    catch(e) {

      console.log('Fail to setup hooks, aborting...');
    }

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

      let slave = new SlavePair(handle, overlay /*, hookproc */ );


      this.slavePairs.push(slave);
    }
  }

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
