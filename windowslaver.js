
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

class Slaving {
  constructor(handle, overlay) {
    this.handle = handle;
    this.overlay = overlay;
  }

  handle() {
    return this.handle;
  }

  overlay() {
    return this.overlay;
  }

}

class Windowslaver {
  constructor() {
    console.log('initializing windowslaver');
    this.slaveHandles = [];

  }

  addHandle(handle, overlay) {
    console.log('addHandle');
    if(this.slaveHandles.some(e => e.handle === handle)) {
      console.log('Inclusion issued for already tracked handle ' + handle);
      // reconfigure?
    }
    else {
      console.log('Adding handle ' + handle);

      // Not guaranteed to succeed due to ? (prob initialization?)
      var parentage = user32.SetWindowLongPtrA(overlay, -8, handle);
      console.log('parentage returned ' + parentage);

      var restore = user32.PostMessageA(overlay, 0x112, 0xF120, 0x0); // WM_SYSCOMMAND, SC_RESTORE, 0X0
      console.log('restore returned ' + restore);

      var initPos = user32.SetWindowPos(overlay, handle, 0, 0, 0, 0, (0x2 | 0x1 | 0x10 | 0x4000 | 0x40)); // SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_ASYNCWINDOWPOS | SWP_SHOWWINDOW
      console.log('initPos returned ' + initPos);

      let slave = new Slaving(handle, overlay);
      this.slaveHandles.push(slave);
      // hook
    }
  }

  removeHandle(handle) {
    console.log('removeHandle');
    if(this.slaveHandles.some(e => e.handle === handle)) {
      console.log('Removing handle ' + handle);
      this.slaveHandles.splice( this.slaveHandles.findIndex(e => e.handle === handle), 1);
      // unhook
    }
    else {
      console.log('Removal issued for untracked handle ' + handle);
      // ?
    }
  }

  // throwaway
  iterated() {
    //console.log('iterated');
    this.slaveHandles.forEach( function(item, index) {
      //console.log(item, index);
      var strct = Buffer.alloc(4 * 4);
      var rectQuery = user32.GetWindowRect(item.handle, strct);

      let rect = {};
      rect.left = strct.readUInt32LE(0);
      rect.top = strct.readUInt32LE(4);
      rect.right = strct.readUInt32LE(8);
      rect.bottom = strct.readUInt32LE(12);

      var pos = user32.SetWindowPos(item.overlay, -2, rect.left, rect.top + 40, rect.right - rect.left, rect.bottom - rect.top - 40, 0x10);
      console.log('handle ' + item.handle + ' windowpos : ' + pos);

      // sometimes fails on addHandle due to overlay window not being constructed yet? Otherwise shouldnt be here
      var parentage = user32.SetWindowLongPtrA(item.overlay, -8, item.handle);
      console.log('parentage returned ' + parentage);
    });
  }

}

module.exports = Windowslaver;
