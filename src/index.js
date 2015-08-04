'use strict';

var Duplex = require('readable-stream').Duplex;
var util = require('util');

// Inherit of Duplex stream
util.inherits(BufferStream, Duplex);

// Constructor
function BufferStream(options, cb) {
  var _this = this;

  // Ensure new were used
  if (!(this instanceof BufferStream)) {
    return new BufferStream(options, cb);
  }

  // Cast args
  if(options instanceof Function) {
    cb = options;
    options = {};
  }
  options = options || {};
  if(!(cb instanceof Function)) {
    throw new Error('The given callback must be a function.');
  }
  this.__objectMode = options.objectMode;

  // Parent constructor
  Duplex.call(this, options);

  // Keep a reference to the callback
  this._cb = cb;

  // Add a finished flag
  this._bufferStreamFinished = false;

  // Internal buffer
  this._buf = [];

  this.on('finish', function() {
    _this._cb(null, options.objectMode ? _this._buf : Buffer.concat(_this._buf), function(err, buf) {
      if(err) {
        _this.emit('error', err);
      }
      _this._buf = options.objectMode ? buf : [buf];
      _this._bufferStreamFinished = true;
      _this._read();
    });
  });
}

BufferStream.prototype._write = function _bufferStreamWrite(chunk, encoding, done) {
  this._buf.push(chunk);
  done();
};

BufferStream.prototype._read = function _bufferStreamRead(n) {
  var _this = this;
  var buf;

  if(_this._bufferStreamFinished) {
    while(_this._buf.length) {
      buf = _this._buf.shift();
      if(!_this.push(buf)) {
        break;
      }
    }
    if(0 === _this._buf.length) {
      _this.push(null);
    }
  }

};

module.exports = BufferStream;
