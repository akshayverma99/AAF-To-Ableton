/**
 * BinaryReader - a DataView wrapper with helper methods for reading AAF binary data
 */
export class BinaryReader {
  constructor(buffer) {
    if (buffer instanceof ArrayBuffer) {
      this.buffer = buffer
      this.view = new DataView(buffer)
      this.bytes = new Uint8Array(buffer)
    } else if (buffer instanceof Uint8Array) {
      this.buffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
      this.view = new DataView(this.buffer)
      this.bytes = new Uint8Array(this.buffer)
    } else if (Array.isArray(buffer)) {
      const ab = new Uint8Array(buffer).buffer
      this.buffer = ab
      this.view = new DataView(ab)
      this.bytes = new Uint8Array(ab)
    } else {
      throw new Error('BinaryReader: unsupported buffer type')
    }
    this.offset = 0
    this.littleEndian = true
  }

  get length() {
    return this.bytes.length
  }

  seek(offset) {
    this.offset = offset
  }

  skip(n) {
    this.offset += n
  }

  canRead(n) {
    return this.offset + n <= this.length
  }

  readUInt8() {
    const val = this.view.getUint8(this.offset)
    this.offset += 1
    return val
  }

  readInt8() {
    const val = this.view.getInt8(this.offset)
    this.offset += 1
    return val
  }

  readUInt16() {
    const val = this.view.getUint16(this.offset, this.littleEndian)
    this.offset += 2
    return val
  }

  readInt16() {
    const val = this.view.getInt16(this.offset, this.littleEndian)
    this.offset += 2
    return val
  }

  readUInt32() {
    const val = this.view.getUint32(this.offset, this.littleEndian)
    this.offset += 4
    return val
  }

  readInt32() {
    const val = this.view.getInt32(this.offset, this.littleEndian)
    this.offset += 4
    return val
  }

  readInt64() {
    const lo = this.view.getUint32(this.offset, this.littleEndian)
    const hi = this.view.getInt32(this.offset + 4, this.littleEndian)
    this.offset += 8
    // Return as number (may lose precision for very large values, but sufficient for edit units)
    return hi * 0x100000000 + lo
  }

  readUInt64() {
    const lo = this.view.getUint32(this.offset, this.littleEndian)
    const hi = this.view.getUint32(this.offset + 4, this.littleEndian)
    this.offset += 8
    return hi * 0x100000000 + lo
  }

  readBytes(n) {
    const slice = this.bytes.slice(this.offset, this.offset + n)
    this.offset += n
    return slice
  }

  peekUInt16(offset) {
    if (offset + 2 > this.length) return 0
    return this.view.getUint16(offset, this.littleEndian)
  }

  peekUInt16BE(offset) {
    if (offset + 2 > this.length) return 0
    return this.view.getUint16(offset, false)
  }

  // Read a Rational: two Int32 values (numerator, denominator)
  readRational() {
    const numerator = this.readInt32()
    const denominator = this.readInt32()
    return { numerator, denominator }
  }

  // Read a UTF-16LE null-terminated string
  readUTF16String(maxBytes) {
    const start = this.offset
    const end = maxBytes != null ? Math.min(start + maxBytes, this.length) : this.length
    const chars = []
    let i = start
    while (i + 1 < end) {
      const code = this.view.getUint16(i, true)
      i += 2
      if (code === 0) break
      chars.push(String.fromCharCode(code))
    }
    if (maxBytes != null) {
      this.offset = start + maxBytes
    } else {
      this.offset = i
    }
    return chars.join('')
  }

  // Read a null-terminated ASCII/UTF-8 string
  readNullTerminatedString(maxBytes) {
    const start = this.offset
    const end = maxBytes != null ? Math.min(start + maxBytes, this.length) : this.length
    const chars = []
    let i = start
    while (i < end) {
      const code = this.bytes[i]
      i++
      if (code === 0) break
      chars.push(String.fromCharCode(code))
    }
    if (maxBytes != null) {
      this.offset = start + maxBytes
    } else {
      this.offset = i
    }
    return chars.join('')
  }

  // Read 16 bytes as AUID
  readAUID() {
    return Array.from(this.readBytes(16))
  }

  // Read 32 bytes as UMID/MobID
  readUMID() {
    return Array.from(this.readBytes(32))
  }

  // Slice a sub-reader from current offset
  slice(offset, length) {
    const sub = this.bytes.slice(offset, offset + length)
    return new BinaryReader(sub)
  }
}

export default BinaryReader
