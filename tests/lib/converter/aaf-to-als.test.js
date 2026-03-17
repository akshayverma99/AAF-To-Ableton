import { describe, it, expect, vi } from 'vitest'
import { validateAAFFile, convertAAFtoALS } from '../../../src/lib/converter/aaf-to-als.js'

describe('validateAAFFile', () => {
  it('returns false for null', () => {
    expect(validateAAFFile(null)).toBe(false)
  })

  it('returns false for empty buffer', () => {
    expect(validateAAFFile(new ArrayBuffer(0))).toBe(false)
  })

  it('returns false for random bytes', () => {
    const buf = new ArrayBuffer(8)
    new Uint8Array(buf).fill(0x00)
    expect(validateAAFFile(buf)).toBe(false)
  })

  it('returns true for OLE2 magic bytes', () => {
    const magic = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]
    const buf = new ArrayBuffer(16)
    new Uint8Array(buf).set(magic)
    expect(validateAAFFile(buf)).toBe(true)
  })

  it('returns false for near-miss magic', () => {
    const magic = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0x00] // last byte wrong
    const buf = new ArrayBuffer(16)
    new Uint8Array(buf).set(magic)
    expect(validateAAFFile(buf)).toBe(false)
  })
})

describe('convertAAFtoALS', () => {
  it('rejects non-AAF data', async () => {
    const randomData = new ArrayBuffer(100)
    new Uint8Array(randomData).fill(0x42)

    await expect(convertAAFtoALS(randomData)).rejects.toThrow()
  })

  it('rejects empty buffer', async () => {
    await expect(convertAAFtoALS(new ArrayBuffer(0))).rejects.toThrow()
  })

  it('calls onProgress callback', async () => {
    const progress = vi.fn()
    const randomData = new ArrayBuffer(100)
    new Uint8Array(randomData).fill(0x42)

    try {
      await convertAAFtoALS(randomData, { onProgress: progress })
    } catch (e) {
      // Expected to fail on invalid data
    }

    // Progress should have been called at least once before failing
    expect(progress).toHaveBeenCalled()
    expect(progress.mock.calls[0][0]).toBeGreaterThanOrEqual(0)
    expect(progress.mock.calls[0][0]).toBeLessThanOrEqual(1)
  })
})

describe('full conversion pipeline (integration)', () => {
  it('generates valid XML from a synthetic timeline', async () => {
    const { generateALSXML } = await import('../../../src/lib/ableton/als-generator.js')
    const { gzipString } = await import('../../../src/utils/compression.js')

    const timeline = {
      name: 'Test',
      editRate: { numerator: 48000, denominator: 1 },
      tracks: [{
        id: 1,
        name: 'Audio 1',
        isAudio: true,
        editRate: { numerator: 48000, denominator: 1 },
        clips: [{
          startTime: 0,
          length: 96000,
          startPosition: 0,
          filePath: '/Users/test/audio.wav',
          trackName: 'My Audio',
        }],
      }],
      warnings: [],
    }

    const xml = generateALSXML(timeline, { tempo: 120, sampleRate: 48000 })
    expect(xml).toContain('<Ableton')
    expect(xml).toContain('My Audio')
    expect(xml).toContain('/Users/test/audio.wav')

    // Compress it
    const compressed = gzipString(xml)
    expect(compressed).toBeInstanceOf(Uint8Array)
    expect(compressed.length).toBeGreaterThan(0)

    // Verify it's actually gzip data (starts with gzip magic bytes)
    expect(compressed[0]).toBe(0x1f)
    expect(compressed[1]).toBe(0x8b)
  })

  it('round-trips XML through compression', async () => {
    const { generateALSXML } = await import('../../../src/lib/ableton/als-generator.js')
    const { gzipString, gunzipToString } = await import('../../../src/utils/compression.js')

    const timeline = {
      name: 'RoundTrip',
      editRate: { numerator: 25, denominator: 1 },
      tracks: [],
      warnings: [],
    }

    const xml = generateALSXML(timeline)
    const compressed = gzipString(xml)
    const decompressed = gunzipToString(compressed)

    expect(decompressed).toBe(xml)
  })
})
