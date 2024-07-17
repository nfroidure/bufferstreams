import { describe, expect, test } from '@jest/globals';
import { YError } from 'yerror';
import StreamTest from 'streamtest';
import { BufferStream } from './index.js';

// Helpers
function syncBufferPrefixer(headerText: string) {
  return new BufferStream(
    (err, buf, cb) => {
      expect(err).toBeNull();
      if (null === buf) {
        cb(null, Buffer.from(headerText));
        return;
      }
      cb(null, Buffer.concat([Buffer.from(headerText), buf]));
    },
    {
      objectMode: false,
    },
  );
}

function syncObjectsPrefixer<T>(prefixObject: T) {
  return new BufferStream(
    (err, objs, cb) => {
      expect(err).toBeNull();
      if (null === objs) {
        cb(null, [prefixObject]);
        return;
      }
      cb(null, [prefixObject, ...objs]);
    },
    {
      objectMode: true,
    },
  );
}

function asyncBufferPrefixer(headerText: string) {
  return new BufferStream(
    (err, buf, cb) => {
      expect(err).toBeNull();
      if (null === buf) {
        setTimeout(() => {
          cb(null, Buffer.from(headerText));
        }, 0);
      } else {
        setTimeout(() => {
          cb(null, Buffer.concat([Buffer.from(headerText), buf]));
        }, 0);
      }
    },
    {
      objectMode: false,
    },
  );
}

describe('bufferstreams', () => {
  test('should fail when callback is not a function', () => {
    try {
      new BufferStream(undefined as unknown as <T>(t: T) => Promise<T>);
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect((err as YError).code).toEqual('E_BAD_CALLBACK');
    }
  });

  describe('in buffer mode', () => {
    describe('synchonously', () => {
      test('should work with one pipe', async () => {
        const [stream, result] = StreamTest.toText();

        StreamTest.fromChunks([Buffer.from('te'), Buffer.from('st')])
          .pipe(syncBufferPrefixer('plop'))
          .pipe(stream);

        expect(await result).toEqual('ploptest');
      });

      test('should work when returning a null buffer', async () => {
        const [stream, result] = StreamTest.toText();

        StreamTest.fromChunks([Buffer.from('te'), Buffer.from('st')])
          .pipe(
            new BufferStream((err, buf, cb) => {
              if (err) {
                cb(err);
                return;
              }
              cb(null, null);
            }),
          )
          .pipe(stream);

        expect(await result).toEqual('');
      });

      test('should work with an async handler', async () => {
        const [stream, result] = StreamTest.toText();

        StreamTest.fromChunks([Buffer.from('te'), Buffer.from('st')])
          .pipe(
            new BufferStream(async (buf) => {
              return buf;
            }),
          )
          .pipe(stream);

        expect(await result).toEqual('test');
      });

      test('should work with multiple pipes', async () => {
        const [stream, result] = StreamTest.toText();

        StreamTest.fromChunks([Buffer.from('te'), Buffer.from('st')])
          .pipe(syncBufferPrefixer('plop'))
          .pipe(syncBufferPrefixer('plip'))
          .pipe(syncBufferPrefixer('plap'))
          .pipe(stream);

        expect(await result).toEqual('plapplipploptest');
      });
    });

    describe('asynchonously', () => {
      test('should work with one pipe', async () => {
        const [stream, result] = StreamTest.toText();

        StreamTest.fromChunks([Buffer.from('te'), Buffer.from('st')])
          .pipe(asyncBufferPrefixer('plop'))
          .pipe(stream);

        expect(await result).toEqual('ploptest');
      });

      test('should work when returning a null buffer', async () => {
        const [stream, result] = StreamTest.toText();

        StreamTest.fromChunks([Buffer.from('te'), Buffer.from('st')])
          .pipe(
            new BufferStream((err, _buf, cb) => {
              if (err) {
                cb(err);
                return;
              }
              cb(null, null);
            }),
          )
          .pipe(stream);

        expect(await result).toEqual('');
      });

      test('should work with multiple pipes', async () => {
        const [stream, result] = StreamTest.toText();

        StreamTest.fromChunks([Buffer.from('te'), Buffer.from('st')])
          .pipe(asyncBufferPrefixer('plop'))
          .pipe(asyncBufferPrefixer('plip'))
          .pipe(asyncBufferPrefixer('plap'))
          .pipe(stream);

        expect(await result).toEqual('plapplipploptest');
      });

      test('should report stream errors', async () => {
        const [stream, result] = StreamTest.toText();
        const bufferStream = new BufferStream(
          (err, _objs, cb) => {
            expect((err as YError).code).toEqual('E_ERROR');
            cb(null, []);
          },
          {
            objectMode: true,
          },
        );

        StreamTest.fromErroredChunks(new YError('E_ERROR'), [
          Buffer.from('ou'),
          Buffer.from('de'),
          Buffer.from('la'),
          Buffer.from('li'),
        ])
          .on('error', (err) => {
            bufferStream.emit('error', err);
          })
          .pipe(bufferStream)
          .pipe(stream);

        expect(await result).toEqual('');
      });

      test('should emit callback errors', async () => {
        const [stream, result] = StreamTest.toText();
        let caughtError: YError = new YError('E_UNEXPECTED_SUCCESS');

        StreamTest.fromChunks([
          Buffer.from('ou'),
          Buffer.from('de'),
          Buffer.from('la'),
          Buffer.from('li'),
        ])
          .pipe(
            new BufferStream((err, _objs, cb) => {
              if (err) {
                cb(err);
                return;
              }
              cb(new YError('E_ERROR'), Buffer.from(''));
            }),
          )
          .on('error', (err) => {
            caughtError = err as YError;
          })
          .pipe(stream);

        expect(await result).toEqual('');
        expect(caughtError.code).toEqual('E_ERROR');
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
      test('should work with one pipe', async () => {
        const [stream, result] = StreamTest.toObjects();

        StreamTest.fromObjects([object1, object2])
          .pipe(syncObjectsPrefixer(object4))
          .pipe(stream);
        expect(await result).toEqual([object4, object1, object2]);
      });

      test('should work when returning an empty array', async () => {
        const [stream, result] = StreamTest.toObjects();

        StreamTest.fromObjects([object1, object2])
          .pipe(
            new BufferStream(
              (err, _objs, cb) => {
                if (err) {
                  cb(err);
                  return;
                }
                cb(null, []);
              },
              {
                objectMode: true,
              },
            ),
          )
          .pipe(stream);
        expect((await result).length).toEqual(0);
      });

      test('should work with multiple pipes', async () => {
        const [stream, result] = StreamTest.toObjects();

        StreamTest.fromObjects([object1, object2])
          .pipe(syncObjectsPrefixer(object4))
          .pipe(syncObjectsPrefixer(object5))
          .pipe(syncObjectsPrefixer(object6))
          .pipe(stream);
        expect(await result).toEqual([
          object6,
          object5,
          object4,
          object1,
          object2,
        ]);
      });
    });

    describe('asynchonously', () => {
      test('should work with one pipe', async () => {
        const [stream, result] = StreamTest.toObjects();

        StreamTest.fromObjects([object1, object2])
          .pipe(syncObjectsPrefixer(object4))
          .pipe(stream);
        expect(await result).toEqual([object4, object1, object2]);
      });

      test('should work when returning an empty array', async () => {
        const [stream, result] = StreamTest.toObjects();

        StreamTest.fromObjects([object1, object2])
          .pipe(
            new BufferStream(
              (err, _objs, cb) => {
                if (err) {
                  cb(err);
                  return;
                }
                cb(null, []);
              },
              {
                objectMode: true,
              },
            ),
          )
          .pipe(stream);
        expect((await result).length).toEqual(0);
      });

      test('should work when returning legacy null', async () => {
        const [stream, result] = StreamTest.toObjects();

        StreamTest.fromObjects([object1, object2])
          .pipe(
            new BufferStream(
              (err, _objs, cb) => {
                if (err) {
                  cb(err);
                  return;
                }
                cb(null, null);
              },
              {
                objectMode: true,
              },
            ),
          )
          .pipe(stream);
        expect((await result).length).toEqual(0);
      });

      test('should work with multiple pipes', async () => {
        const [stream, result] = StreamTest.toObjects();

        StreamTest.fromObjects([object1, object2])
          .pipe(syncObjectsPrefixer(object4))
          .pipe(syncObjectsPrefixer(object5))
          .pipe(syncObjectsPrefixer(object6))
          .pipe(stream);
        expect(await result).toEqual([
          object6,
          object5,
          object4,
          object1,
          object2,
        ]);
      });

      test('should report stream errors', async () => {
        const [stream, result] = StreamTest.toObjects();

        const bufferStream = new BufferStream(
          (err, _objs, cb) => {
            expect((err as YError).code).toEqual('E_ERROR');
            cb(null, []);
          },
          {
            objectMode: true,
          },
        );

        StreamTest.fromErroredObjects(new YError('E_ERROR'), [
          object1,
          object2,
          object3,
          object4,
          object5,
          object6,
          object7,
        ])
          .on('error', (err) => {
            bufferStream.emit('error', err);
          })
          .pipe(bufferStream)
          .pipe(stream);
        expect(await result).toEqual([]);
      });

      test('should emit callback errors', async () => {
        const [stream, result] = StreamTest.toObjects();
        let caughtError: YError = new YError('E_UNEXPECTED_SUCCESS');

        StreamTest.fromObjects([
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
              (err, _objs, cb) => {
                if (err) {
                  cb(err, []);
                  return;
                }
                cb(new YError('E_ERROR'), []);
              },
              {
                objectMode: true,
              },
            ),
          )
          .on('error', (err) => {
            caughtError = err as YError;
          })
          .pipe(stream);

        expect(await result).toEqual([]);
        expect(caughtError.code).toEqual('E_ERROR');
      });
    });
  });
});
