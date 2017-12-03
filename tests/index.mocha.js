/* eslint max-nested-callbacks: 0 */

'use strict';

const assert = require('assert');
const StreamTest = require('streamtest');
const BufferStream = require('../src');

// Helpers
function syncBufferPrefixer(headerText) {
  return new BufferStream(
    {
      objectMode: headerText instanceof Object,
    },
    (err, buf, cb) => {
      assert.equal(err, null);
      if (null === buf) {
        cb(null, new Buffer(headerText));
        return;
      } else if (buf instanceof Array) {
        buf.unshift(headerText);
        cb(null, buf);
        return;
      }
      cb(null, Buffer.concat([new Buffer(headerText), buf]));
    }
  );
}

function asyncBufferPrefixer(headerText) {
  return new BufferStream(
    {
      objectMode: headerText instanceof Object,
    },
    (err, buf, cb) => {
      assert.equal(err, null);
      if (null === buf) {
        setTimeout(() => {
          cb(null, new Buffer(headerText));
        }, 0);
      } else if (buf instanceof Array) {
        setTimeout(() => {
          buf.push(headerText);
          cb(null, buf);
        }, 0);
      } else {
        setTimeout(() => {
          cb(null, Buffer.concat([new Buffer(headerText), buf]));
        }, 0);
      }
    }
  );
}

// Tests
describe('bufferstreams', () => {
  it('should fail when callback is not a function', () => {
    assert.throws(() => {
      new BufferStream(); // eslint-disable-line
    });
  });

  // Iterating through versions
  StreamTest.versions.forEach(version => {
    describe('for ' + version + ' streams', () => {
      describe('in buffer mode', () => {
        describe('synchonously', () => {
          it('should work with one pipe', done => {
            StreamTest[version]
              .fromChunks(['te', 'st'])
              .pipe(syncBufferPrefixer('plop'))
              .pipe(
                StreamTest[version].toText((err, data) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  assert.equal(data, 'ploptest');
                  done();
                })
              );
          });

          it('should work when returning a null buffer', done => {
            StreamTest[version]
              .fromChunks(['te', 'st'])
              .pipe(
                new BufferStream((err, buf, cb) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  cb(null, null);
                })
              )
              .pipe(
                StreamTest[version].toText((err, data) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  assert.equal(data, '');
                  done();
                })
              );
          });

          it('should work with multiple pipes', done => {
            StreamTest[version]
              .fromChunks(['te', 'st'])
              .pipe(syncBufferPrefixer('plop'))
              .pipe(syncBufferPrefixer('plip'))
              .pipe(syncBufferPrefixer('plap'))
              .pipe(
                StreamTest[version].toText((err, data) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  assert.equal(data, 'plapplipploptest');
                  done();
                })
              );
          });
        });

        describe('asynchonously', () => {
          it('should work with one pipe', done => {
            StreamTest[version]
              .fromChunks(['te', 'st'])
              .pipe(asyncBufferPrefixer('plop'))
              .pipe(
                StreamTest[version].toText((err, data) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  assert.equal(data, 'ploptest');
                  done();
                })
              );
          });

          it('should work when returning a null buffer', done => {
            StreamTest[version]
              .fromChunks(['te', 'st'])
              .pipe(
                new BufferStream((err, buf, cb) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  cb(null, null);
                })
              )
              .pipe(
                StreamTest[version].toText((err, data) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  assert.equal(data, '');
                  done();
                })
              );
          });

          it('should work with multiple pipes', done => {
            StreamTest[version]
              .fromChunks(['te', 'st'])
              .pipe(asyncBufferPrefixer('plop'))
              .pipe(asyncBufferPrefixer('plip'))
              .pipe(asyncBufferPrefixer('plap'))
              .pipe(
                StreamTest[version].toText((err, data) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  assert.equal(data, 'plapplipploptest');
                  done();
                })
              );
          });

          it('should report stream errors', done => {
            const bufferStream = new BufferStream(
              {
                objectMode: true,
              },
              (err, objs, cb) => {
                assert.equal(err.message, 'Aouch!');
                cb(null, []);
              }
            );

            StreamTest[version]
              .fromErroredChunks(new Error('Aouch!'), ['ou', 'de', 'la', 'li'])
              .on('error', err => {
                bufferStream.emit('error', err);
              })
              .pipe(bufferStream)
              .pipe(
                StreamTest[version].toText((err, text) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  assert.deepEqual(text, '');
                  done();
                })
              );
          });

          it('should emit callback errors', done => {
            let caughtError = null;

            StreamTest[version]
              .fromChunks(['ou', 'de', 'la', 'li'])
              .pipe(
                new BufferStream((err, objs, cb) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  cb(new Error('Aouch!'), '');
                })
              )
              .on('error', err => {
                caughtError = err;
              })
              .pipe(
                StreamTest[version].toText((err, text) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  assert.equal(caughtError.message, 'Aouch!');
                  assert.equal(text, '');
                  done();
                })
              );
          });
        });
      });

      describe('in object mode', () => {
        const object1 = { txt: 'te' };
        const object2 = { txt: 'st' };
        const object3 = { txt: 'e' };
        const object4 = { txt: 'd' };
        const object5 = { txt: 'u' };
        const object6 = { txt: 'ni' };
        const object7 = { txt: 't' };

        describe('synchonously', () => {
          it('should work with one pipe', done => {
            StreamTest[version]
              .fromObjects([object1, object2])
              .pipe(syncBufferPrefixer(object4))
              .pipe(
                StreamTest[version].toObjects((err, objs) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  assert.deepEqual(objs, [object4, object1, object2]);
                  done();
                })
              );
          });

          it('should work when returning an empty array', done => {
            StreamTest[version]
              .fromObjects([object1, object2])
              .pipe(
                new BufferStream(
                  {
                    objectMode: true,
                  },
                  (err, buf, cb) => {
                    if (err) {
                      done(err);
                      return;
                    }
                    cb(null, []);
                  }
                )
              )
              .pipe(
                StreamTest[version].toObjects((err, objs) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  assert.equal(objs.length, 0);
                  done();
                })
              );
          });

          it('should work with multiple pipes', done => {
            StreamTest[version]
              .fromObjects([object1, object2])
              .pipe(syncBufferPrefixer(object4))
              .pipe(syncBufferPrefixer(object5))
              .pipe(syncBufferPrefixer(object6))
              .pipe(
                StreamTest[version].toObjects((err, objs) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  assert.deepEqual(objs, [
                    object6,
                    object5,
                    object4,
                    object1,
                    object2,
                  ]);
                  done();
                })
              );
          });
        });

        describe('asynchonously', () => {
          it('should work with one pipe', done => {
            StreamTest[version]
              .fromObjects([object1, object2])
              .pipe(syncBufferPrefixer(object4))
              .pipe(
                StreamTest[version].toObjects((err, objs) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  assert.deepEqual(objs, [object4, object1, object2]);
                  done();
                })
              );
          });

          it('should work when returning an empty array', done => {
            StreamTest[version]
              .fromObjects([object1, object2])
              .pipe(
                new BufferStream(
                  {
                    objectMode: true,
                  },
                  (err, objs, cb) => {
                    if (err) {
                      done(err);
                      return;
                    }
                    cb(null, []);
                  }
                )
              )
              .pipe(
                StreamTest[version].toObjects((err, objs) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  assert.equal(objs.length, 0);
                  done();
                })
              );
          });

          it('should work when returning legacy null', done => {
            StreamTest[version]
              .fromObjects([object1, object2])
              .pipe(
                new BufferStream(
                  {
                    objectMode: true,
                  },
                  (err, objs, cb) => {
                    if (err) {
                      done(err);
                      return;
                    }
                    cb(null, null);
                  }
                )
              )
              .pipe(
                StreamTest[version].toObjects((err, objs) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  assert.equal(objs.length, 0);
                  done();
                })
              );
          });

          it('should work with multiple pipes', done => {
            StreamTest[version]
              .fromObjects([object1, object2])
              .pipe(syncBufferPrefixer(object4))
              .pipe(syncBufferPrefixer(object5))
              .pipe(syncBufferPrefixer(object6))
              .pipe(
                StreamTest[version].toObjects((err, objs) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  assert.deepEqual(objs, [
                    object6,
                    object5,
                    object4,
                    object1,
                    object2,
                  ]);
                  done();
                })
              );
          });

          it('should report stream errors', done => {
            const bufferStream = new BufferStream(
              {
                objectMode: true,
              },
              (err, objs, cb) => {
                assert.equal(err.message, 'Aouch!');
                cb(null, []);
              }
            );

            StreamTest[version]
              .fromErroredObjects(new Error('Aouch!'), [
                object1,
                object2,
                object3,
                object4,
                object5,
                object6,
                object7,
              ])
              .on('error', err => {
                bufferStream.emit('error', err);
              })
              .pipe(bufferStream)
              .pipe(
                StreamTest[version].toObjects((err, objs) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  assert.deepEqual(objs, []);
                  done();
                })
              );
          });

          it('should emit callback errors', done => {
            let caughtError = null;

            StreamTest[version]
              .fromObjects([
                object1,
                object2,
                object3,
                object4,
                object5,
                object6,
                object7,
              ])
              .pipe(
                new BufferStream(
                  {
                    objectMode: true,
                  },
                  (err, objs, cb) => {
                    if (err) {
                      done(err);
                      return;
                    }
                    cb(new Error('Aouch!'), []);
                  }
                )
              )
              .on('error', err => {
                caughtError = err;
              })
              .pipe(
                StreamTest[version].toObjects((err, objs) => {
                  if (err) {
                    done(err);
                    return;
                  }
                  assert.equal(caughtError.message, 'Aouch!');
                  assert.deepEqual(objs, []);
                  done();
                })
              );
          });
        });
      });
    });
  });
});
