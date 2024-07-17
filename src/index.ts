import { Duplex, type Writable } from 'stream';
import { YError } from 'yerror';

export type BufferStreamOptions = {
  objectMode: boolean;
};
export type BufferStreamItem<
  O extends Partial<BufferStreamOptions>,
  T,
> = O extends { objectMode: true } ? T : Buffer;
export type BufferStreamPayload<
  O extends Partial<BufferStreamOptions>,
  T,
> = O extends { objectMode: true } ? T[] : Buffer;
export type BufferStreamHandler<O extends Partial<BufferStreamOptions>, T> = (
  payload: BufferStreamPayload<O, T>,
) => Promise<BufferStreamPayload<O, T>>;
export type BufferStreamCallback<O extends Partial<BufferStreamOptions>, T> = (
  err: Error | null,
  payload: BufferStreamPayload<O, T>,
  cb: (err: Error | null, payload?: null | BufferStreamPayload<O, T>) => void,
) => void;

const DEFAULT_BUFFER_STREAM_OPTIONS = {
  objectMode: false,
};

/**
 * Buffer the stream content and bring it into the provided callback
 */
class BufferStream<T, O extends Partial<BufferStreamOptions>> extends Duplex {
  private _options: BufferStreamOptions = DEFAULT_BUFFER_STREAM_OPTIONS;
  private _bufferCallback: BufferStreamCallback<O, T>;
  private _finished: boolean = false;
  private _buffer: BufferStreamItem<O, T>[] = [];

  /**
   * @param bufferCallback {Function} A function to handle the buffered content.
   * @param options {Object} inherits of Stream.Duplex, the options are passed to the parent constructor so you can use it's options too.
   * @param options.objectMode {boolean} Use if piped in streams are in object mode. In this case, an array of the buffered will be transmitted to the callback function.
   */
  constructor(
    bufferCallback: BufferStreamCallback<O, T> | BufferStreamHandler<O, T>,
    options?: O,
  ) {
    super(options);

    if (!(bufferCallback instanceof Function)) {
      throw new YError('E_BAD_CALLBACK');
    }

    this._options = {
      ...DEFAULT_BUFFER_STREAM_OPTIONS,
      ...options,
    };
    this._bufferCallback =
      bufferCallback.length === 1
        ? (((err, payload, cb) => {
            (bufferCallback as BufferStreamHandler<O, T>)(payload)
              .then((result) => {
                cb(err, result);
              })
              .catch((err) => {
                cb(err);
              });
          }) as BufferStreamCallback<O, T>)
        : (bufferCallback as BufferStreamCallback<O, T>);

    this.once('finish', this._bufferStreamCallbackWrapper);
    this.on('error', this._bufferStreamError);
  }

  _write(
    chunk: BufferStreamItem<O, T>,
    encoding: Parameters<Writable['write']>[1],
    done: () => void,
  ) {
    this._buffer.push(chunk);
    done();
  }

  _read() {
    if (this._finished) {
      while (this._buffer.length) {
        if (!this.push(this._buffer.shift())) {
          break;
        }
      }
      if (0 === this._buffer.length) {
        this.push(null);
      }
    }
  }

  _bufferStreamCallbackWrapper(err: Error) {
    const buffer = (
      this._options.objectMode
        ? (this._buffer as T[])
        : Buffer.concat(this._buffer as Buffer[])
    ) as O extends {
      objectMode: true;
    }
      ? T[]
      : Buffer;

    err = err || null;

    this._bufferCallback(err, buffer, (err2, buf) => {
      setImmediate(() => {
        this.removeListener('error', this._bufferStreamError);
        if (err2) {
          this.emit('error', err2);
        }
        this._buffer = (
          buf == null ? [] : buf instanceof Buffer ? [buf] : buf
        ) as BufferStreamItem<O, T>[];
        this._finished = true;
        this._read();
      });
    });
  }

  _bufferStreamError(err: Error) {
    if (this._finished) {
      return;
    }
    this._bufferStreamCallbackWrapper(err);
  }
}

/**
 * Utility function if you prefer a functional way of using this lib
 * @param bufferCallback
 * @param options
 * @returns Stream
 */
export function bufferStream<T, O extends Partial<BufferStreamOptions>>(
  bufferCallback: BufferStreamCallback<O, T>,
  options: O = DEFAULT_BUFFER_STREAM_OPTIONS as O,
) {
  return new BufferStream<T, O>(bufferCallback, options);
}

/**
 * Utility function to buffer objet mode streams
 * @param bufferCallback
 * @param options
 * @returns Stream
 */
export function bufferObjects<T>(
  bufferCallback: BufferStreamCallback<{ objectMode: true }, T>,
  options: Omit<BufferStreamOptions, 'objectMode'>,
) {
  return new BufferStream<T, { objectMode: true }>(bufferCallback, {
    ...options,
    objectMode: true,
  });
}

export { BufferStream };
