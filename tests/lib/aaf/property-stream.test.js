import { describe, it, expect } from 'vitest'
import { tryParsePropertiesStream, parsePropertyValue, parseUTF16String, parseInlineData } from '../../../src/lib/aaf/property-stream.js'
import { PIDs, StoredForms } from '../../../src/lib/aaf/constants.js'

/**
 * Helper: build a properties stream buffer.
 * Format:
 *   [uint16 BOM=0x4949][uint16 count]
 *   For each: [uint16 PID][uint16 StoredForm][uint32 length][...data]
 */
function buildPropertiesStream(props) {
  // First pass: calculate total size
  let totalSize = 4 // BOM + count
  for (const p of props) {
    totalSize += 2 + 2 + 4 + p.data.length
  }

  const buf = new Uint8Array(totalSize)
  const view = new DataView(buf.buffer)

  let offset = 0
  // BOM little-endian
  view.setUint16(offset, 0x4949, true); offset += 2
  // Count
  view.setUint16(offset, props.length, true); offset += 2

  for (const p of props) {
    view.setUint16(offset, p.pid, true); offset += 2
    view.setUint16(offset, p.storedForm, true); offset += 2
    view.setUint32(offset, p.data.length, true); offset += 4
    buf.set(p.data, offset); offset += p.data.length
  }

  return buf
}

function makeInt32LE(val) {
  const buf = new Uint8Array(4)
  new DataView(buf.buffer).setInt32(0, val, true)
  return buf
}

function makeInt64LE(val) {
  const buf = new Uint8Array(8)
  const view = new DataView(buf.buffer)
  view.setInt32(0, val & 0xFFFFFFFF, true)
  view.setInt32(4, Math.floor(val / 0x100000000), true)
  return buf
}

function makeRationalLE(num, den) {
  const buf = new Uint8Array(8)
  const view = new DataView(buf.buffer)
  view.setInt32(0, num, true)
  view.setInt32(4, den, true)
  return buf
}

function makeUTF16LE(str) {
  const bytes = []
  for (const c of str) {
    const code = c.charCodeAt(0)
    bytes.push(code & 0xFF)
    bytes.push((code >> 8) & 0xFF)
  }
  bytes.push(0, 0) // null terminator
  return new Uint8Array(bytes)
}

describe('tryParsePropertiesStream', () => {
  it('returns null for null input', () => {
    expect(tryParsePropertiesStream(null)).toBeNull()
  })

  it('returns null for too-short input', () => {
    expect(tryParsePropertiesStream(new Uint8Array([0x49, 0x49]))).toBeNull()
  })

  it('returns null for invalid BOM', () => {
    const buf = new Uint8Array([0x00, 0x00, 0x01, 0x00, 0x01, 0x01, 0x82, 0x00, 0x10, 0x00, 0x00, 0x00])
    expect(tryParsePropertiesStream(buf)).toBeNull()
  })

  it('parses a simple properties stream', () => {
    const auid = new Uint8Array(16).fill(0xAA)
    const stream = buildPropertiesStream([
      { pid: PIDs.ObjClass, storedForm: StoredForms.SF_DATA, data: auid }
    ])

    const result = tryParsePropertiesStream(stream)
    expect(result).not.toBeNull()
    expect(result.has(PIDs.ObjClass)).toBe(true)

    const prop = result.get(PIDs.ObjClass)
    expect(prop.pid).toBe(PIDs.ObjClass)
    expect(prop.storedForm).toBe(StoredForms.SF_DATA)
    expect(prop.data.length).toBe(16)
  })

  it('parses multiple properties', () => {
    const auid = new Uint8Array(16).fill(0x06)
    const lengthData = makeInt64LE(48000)

    const stream = buildPropertiesStream([
      { pid: PIDs.ObjClass, storedForm: StoredForms.SF_DATA, data: auid },
      { pid: PIDs.Component_Length, storedForm: StoredForms.SF_DATA, data: lengthData },
    ])

    const result = tryParsePropertiesStream(stream)
    expect(result).not.toBeNull()
    expect(result.size).toBe(2)
    expect(result.has(PIDs.ObjClass)).toBe(true)
    expect(result.has(PIDs.Component_Length)).toBe(true)
  })

  it('accepts Array input', () => {
    const auid = new Uint8Array(16).fill(0x06)
    const stream = buildPropertiesStream([
      { pid: PIDs.ObjClass, storedForm: StoredForms.SF_DATA, data: auid }
    ])
    const arr = Array.from(stream)
    const result = tryParsePropertiesStream(arr)
    expect(result).not.toBeNull()
  })

  it('handles big-endian BOM', () => {
    const buf = new Uint8Array(4 + 8 + 16)
    const view = new DataView(buf.buffer)
    view.setUint16(0, 0x4D4D, false) // BE BOM
    view.setUint16(2, 1, false)      // count = 1
    view.setUint16(4, PIDs.ObjClass, false) // PID
    view.setUint16(6, StoredForms.SF_DATA, false) // stored form
    view.setUint32(8, 16, false) // length
    buf.fill(0xAA, 12) // data

    const result = tryParsePropertiesStream(buf)
    expect(result).not.toBeNull()
  })
})

describe('parseInlineData', () => {
  it('parses ObjClass as 16-byte array', () => {
    const data = new Uint8Array(16).fill(0x06)
    const result = parseInlineData(PIDs.ObjClass, data, 'unknown')
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(16)
  })

  it('parses Component_Length as number', () => {
    const data = makeInt64LE(96000)
    const result = parseInlineData(PIDs.Component_Length, data, 'source_clip')
    expect(result).toBe(96000)
  })

  it('parses MobSlot_SlotID as UInt32', () => {
    const data = new Uint8Array(4)
    new DataView(data.buffer).setUint32(0, 42, true)
    const result = parseInlineData(PIDs.MobSlot_SlotID, data, 'timeline_mob_slot')
    expect(result).toBe(42)
  })

  it('parses TimelineMobSlot_EditRate as Rational', () => {
    const data = makeRationalLE(48000, 1)
    const result = parseInlineData(0x1201, data, 'timeline_mob_slot')
    expect(result).toEqual({ numerator: 48000, denominator: 1 })
  })

  it('parses SourceClip_StartPosition as Int64', () => {
    const data = makeInt64LE(1000)
    const result = parseInlineData(0x1201, data, 'source_clip')
    expect(result).toBe(1000)
  })

  it('parses Mob_Name as UTF-16 string', () => {
    const data = makeUTF16LE('MyTimeline')
    const result = parseInlineData(PIDs.Mob_Name, data, 'composition_mob')
    expect(result).toBe('MyTimeline')
  })

  it('parses NetworkLocator_URL as UTF-16 string', () => {
    const data = makeUTF16LE('file:///audio/track1.wav')
    const result = parseInlineData(PIDs.NetworkLocator_URL, data, 'network_locator')
    expect(result).toBe('file:///audio/track1.wav')
  })
})

describe('parseUTF16String', () => {
  it('parses empty string', () => {
    expect(parseUTF16String(new Uint8Array([0, 0]))).toBe('')
  })

  it('parses ASCII string', () => {
    expect(parseUTF16String(new Uint8Array([72, 0, 105, 0, 0, 0]))).toBe('Hi')
  })

  it('handles string without null terminator', () => {
    expect(parseUTF16String(new Uint8Array([65, 0]))).toBe('A')
  })
})
