# BufferStream [![Build Status](https://travis-ci.org/nfroidure/BufferStream.png?branch=master)](https://travis-ci.org/nfroidure/BufferStream)

BufferStream abstracts streams to allow you to deal with buffers when it becomes
 necessary (by example: a legacy library that do not support streams).

## Usage
Install the [npm module](https://npmjs.org/package/bufferstreams):
```sh
npm install bufferstreams --save
```
Then, in your scripts:
```js
var BufferStream = require('bufferstream');

Fs.createReadStream('input.txt')
  .pipe(new BufferStream(function(err, buf, cb) {

    // err will be filled with an error if the piped in stream emits one.
    if(err) {
      throw err;
    }

    // buf will contain the whole piped in stream contents
    buf = Buffer(buf.toString(utf-8).repalce('foo', 'bar'));

    // cb is a callback to pass the result back to the piped out stream
    // first argument is an error that wil be emitted if one
    // the second argument is the modified buffer
    cb(null, buf);

  }))
  .pipe(Fs.createWriteStream('output.txt'));
```

## Contributing
Feel free to pull your code if you agree with publishing it under the MIT license.

