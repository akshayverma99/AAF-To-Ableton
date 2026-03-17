/**
 * Parse AAF properties streams.
 *
 * CORRECT format (all-headers-then-data):
 *   [1 byte: byte-order  0x4c=LE, 0x4d=BE]
 *   [1 byte: version     0x20]
 *   [2 bytes: count      LE uint16]
 *   [count × 6 bytes: all property headers together]
 *     Each header: [2B PID LE][2B StoredForm LE][2B Length LE]
 *   [all data concatenated in order, each chunk is Length bytes]
 */

/**
 * Parse an AAF properties stream from raw bytes.
 * Returns a Map of PID -> { pid, storedForm, data: Uint8Array }
 * or null if the bytes are not a valid properties stream.
 */
export function tryParsePropertiesStream(content) {
  if (!content) return null

  let bytes
  if (content instanceof Uint8Array) {
    bytes = content
  } else if (Array.isArray(content)) {
    bytes = new Uint8Array(content)
  } else if (content instanceof ArrayBuffer) {
    bytes = new Uint8Array(content)
  } else {
    try { bytes = new Uint8Array(content) } catch { return null }
  }

  if (bytes.length < 4) return null

  // Byte 0: byte order (0x4c = LE, 0x4d = BE)
  const byteOrder = bytes[0]
  if (byteOrder !== 0x4c && byteOrder !== 0x4d) return null

  // Byte 1: version must be 0x20
  if (bytes[1] !== 0x20) return null

  // Bytes 2-3: property count, always LE uint16
  const count = bytes[2] | (bytes[3] << 8)
  if (count === 0 || count > 2000) return null

  // All headers come first (count × 6 bytes)
  const headerEnd = 4 + count * 6
  if (bytes.length < headerEnd) return null

  const headers = []
  let offset = 4
  for (let i = 0; i < count; i++) {
    const pid        = bytes[offset]     | (bytes[offset + 1] << 8)
    const storedForm = bytes[offset + 2] | (bytes[offset + 3] << 8)
    const length     = bytes[offset + 4] | (bytes[offset + 5] << 8)
    headers.push({ pid, storedForm, length })
    offset += 6
  }

  // Data section immediately follows all headers
  const props = new Map()
  let dataOffset = headerEnd
  for (const h of headers) {
    if (dataOffset + h.length > bytes.length) {
      // truncated stream – stop here but return what we have
      break
    }
    props.set(h.pid, {
      pid:        h.pid,
      storedForm: h.storedForm,
      data:       bytes.slice(dataOffset, dataOffset + h.length),
    })
    dataOffset += h.length
  }

  if (props.size === 0) return null
  return props
}

// ---------------------------------------------------------------------------
// Helpers used by other modules
// ---------------------------------------------------------------------------

/**
 * Read a UTF-16LE null-terminated string from a Uint8Array.
 */
export function parseUTF16String(bytes) {
  if (!bytes) return ''
  let s = ''
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const code = bytes[i] | (bytes[i + 1] << 8)
    if (code === 0) break
    s += String.fromCharCode(code)
  }
  return s
}

/**
 * Read a UTF-16LE null-terminated name stored in a strong-ref property.
 * The data may also be UTF-8; fall back gracefully.
 */
export function readStrongRefName(data) {
  if (!data || data.length === 0) return ''
  // Detect UTF-16LE: second byte of first char is often 0 for ASCII names
  if (data.length >= 2 && data[1] === 0) {
    return parseUTF16String(data)
  }
  // Otherwise ASCII / UTF-8
  let s = ''
  for (let i = 0; i < data.length; i++) {
    if (data[i] === 0) break
    s += String.fromCharCode(data[i])
  }
  return s
}

/**
 * Read a little-endian Int64 as a BigInt.
 */
export function readInt64LE(bytes, offset = 0) {
  const lo = readUInt32LE(bytes, offset)
  const hi = readInt32LE(bytes, offset + 4)
  return BigInt(hi) * 0x100000000n + BigInt(lo >>> 0)
}

export function readUInt32LE(bytes, offset = 0) {
  return ((bytes[offset]
         | (bytes[offset + 1] << 8)
         | (bytes[offset + 2] << 16)
         | (bytes[offset + 3] << 24)) >>> 0)
}

export function readInt32LE(bytes, offset = 0) {
  return (bytes[offset]
        | (bytes[offset + 1] << 8)
        | (bytes[offset + 2] << 16)
        | (bytes[offset + 3] << 24))
}

/**
 * Convert a UMID (32-byte Uint8Array) to a hex string.
 */
export function umidToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Return true if the 32-byte UMID is all zeros (means "no reference").
 */
export function isZeroUMID(bytes) {
  if (!bytes || bytes.length < 32) return true
  return bytes.every(b => b === 0)
}
