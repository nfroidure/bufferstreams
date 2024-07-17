# API
## Classes

<dl>
<dt><a href="#BufferStream">BufferStream</a></dt>
<dd><p>Buffer the stream content and bring it into the provided callback</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#bufferStream">bufferStream(bufferCallback, options)</a> ⇒</dt>
<dd><p>Utility function if you prefer a functional way of using this lib</p>
</dd>
<dt><a href="#bufferObjects">bufferObjects(bufferCallback, options)</a> ⇒</dt>
<dd><p>Utility function to buffer objet mode streams</p>
</dd>
</dl>

<a name="BufferStream"></a>

## BufferStream
Buffer the stream content and bring it into the provided callback

**Kind**: global class  
<a name="new_BufferStream_new"></a>

### new BufferStream(bufferCallback, options)

| Param | Type | Description |
| --- | --- | --- |
| bufferCallback | <code>function</code> | A function to handle the buffered content. |
| options | <code>Object</code> | inherits of Stream.Duplex, the options are passed to the parent constructor so you can use it's options too. |
| options.objectMode | <code>boolean</code> | Use if piped in streams are in object mode. In this case, an array of the buffered will be transmitted to the callback function. |

<a name="bufferStream"></a>

## bufferStream(bufferCallback, options) ⇒
Utility function if you prefer a functional way of using this lib

**Kind**: global function  
**Returns**: Stream  

| Param |
| --- |
| bufferCallback | 
| options | 

<a name="bufferObjects"></a>

## bufferObjects(bufferCallback, options) ⇒
Utility function to buffer objet mode streams

**Kind**: global function  
**Returns**: Stream  

| Param |
| --- |
| bufferCallback | 
| options | 

