import { describe, it, expect } from 'vitest'
import { BinaryReader } from '../../../src/lib/aaf/binary-reader.js'

describe('BinaryReader', () => {
  describe('construction', () => {
    it('accepts ArrayBuffer', () => {
      const ab = new ArrayBuffer(4)
      const r = new BinaryReader(ab)
      expect(r.length).toBe(4)
    })

    it('accepts Uint8Array', () => {
      const buf = new Uint8Array([1, 2, 3, 4])
      const r = new BinaryReader(buf)
      expect(r.length).toBe(4)
    })

    it('accepts plain Array', () => {
      const r = new BinaryReader([0x01, 0x02, 0x03, 0x04])
      expect(r.length).toBe(4)
    })

    it('throws on unsupported type', () => {
      expect(() => new BinaryReader('hello')).toThrow()
    })
  })

  describe('integer reading (little-endian)', () => {
    it('reads UInt8', () => {
      const r = new BinaryReader([0xFF, 0x00])
      expect(r.readUInt8()).toBe(0xFF)
      expect(r.readUInt8()).toBe(0x00)
    })

    it('reads UInt16 LE', () => {
      const r = new BinaryReader([0x01, 0x02])
      r.littleEndian = true
      expect(r.readUInt16()).toBe(0x0201)
    })

    it('reads UInt16 BE', () => {
      const r = new BinaryReader([0x01, 0x02])
      r.littleEndian = false
      expect(r.readUInt16()).toBe(0x0102)
    })

    it('reads UInt32 LE', () => {
      const r = new BinaryReader([0x01, 0x00, 0x00, 0x00])
      expect(r.readUInt32()).toBe(1)
    })

    it('reads Int32 LE signed', () => {
      // -1 in little endian is FF FF FF FF
      const r = new BinaryReader([0xFF, 0xFF, 0xFF, 0xFF])
      expect(r.readInt32()).toBe(-1)
    })

    it('reads Int64 LE', () => {
      // 1 as Int64 LE
      const r = new BinaryReader([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
      expect(r.readInt64()).toBe(1)
    })

    it('reads Int64 larger value', () => {
      // 48000 as Int64 LE
      const buf = new Uint8Array(8)
      const view = new DataView(buf.buffer)
      view.setInt32(0, 48000, true)
      view.setInt32(4, 0, true)
      const r = new BinaryReader(buf)
      expect(r.readInt64()).toBe(48000)
    })
  })

  describe('seeking and skipping', () => {
    it('seek moves offset', () => {
      const r = new BinaryReader([0x01, 0x02, 0x03, 0x04])
      r.seek(2)
      expect(r.readUInt8()).toBe(0x03)
    })

    it('skip advances offset', () => {
      const r = new BinaryReader([0x01, 0x02, 0x03, 0x04])
      r.skip(2)
      expect(r.readUInt8()).toBe(0x03)
    })

    it('canRead returns false when not enough bytes', () => {
      const r = new BinaryReader([0x01, 0x02])
      r.seek(1)
      expect(r.canRead(2)).toBe(false)
    })

    it('canRead returns true when enough bytes', () => {
      const r = new BinaryReader([0x01, 0x02, 0x03])
      expect(r.canRead(3)).toBe(true)
    })
  })

  describe('reading bytes', () => {
    it('reads N bytes', () => {
      const r = new BinaryReader([0x01, 0x02, 0x03, 0x04])
      const b = r.readBytes(2)
      expect(Array.from(b)).toEqual([0x01, 0x02])
      expect(r.offset).toBe(2)
    })

    it('reads AUID (16 bytes)', () => {
      const data = Array.from({ length: 20 }, (_, i) => i)
      const r = new BinaryReader(data)
      const auid = r.readAUID()
      expect(auid.length).toBe(16)
      expect(auid[0]).toBe(0)
      expect(auid[15]).toBe(15)
      expect(r.offset).toBe(16)
    })

    it('reads UMID (32 bytes)', () => {
      const data = Array.from({ length: 32 }, (_, i) => i)
      const r = new BinaryReader(data)
      const umid = r.readUMID()
      expect(umid.length).toBe(32)
      expect(r.offset).toBe(32)
    })
  })

  describe('string reading', () => {
    it('reads null-terminated ASCII string', () => {
      const r = new BinaryReader([72, 101, 108, 108, 111, 0, 99])
      expect(r.readNullTerminatedString()).toBe('Hello')
    })

    it('reads UTF-16LE string', () => {
      // "Hi" in UTF-16LE: 48 00 69 00 00 00
      const r = new BinaryReader([0x48, 0x00, 0x69, 0x00, 0x00, 0x00])
      expect(r.readUTF16String()).toBe('Hi')
    })

    it('reads UTF-16LE string with maxBytes', () => {
      const r = new BinaryReader([0x41, 0x00, 0x42, 0x00, 0x43, 0x00, 0x00, 0x00])
      const s = r.readUTF16String(8)
      expect(s).toBe('ABC')
    })
  })

  describe('rational reading', () => {
    it('reads Rational as {numerator, denominator}', () => {
      const buf = new Uint8Array(8)
      const view = new DataView(buf.buffer)
      view.setInt32(0, 48000, true)
      view.setInt32(4, 1, true)
      const r = new BinaryReader(buf)
      const rat = r.readRational()
      expect(rat.numerator).toBe(48000)
      expect(rat.denominator).toBe(1)
    })
  })

  describe('slicing', () => {
    it('creates a sub-reader', () => {
      const r = new BinaryReader([0x01, 0x02, 0x03, 0x04, 0x05])
      const sub = r.slice(1, 3)
      expect(sub.length).toBe(3)
      expect(sub.readUInt8()).toBe(0x02)
    })
  })
})
