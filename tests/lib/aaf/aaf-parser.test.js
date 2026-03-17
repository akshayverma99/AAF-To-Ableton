import { describe, it, expect } from 'vitest'
import { urlToPath } from '../../../src/lib/aaf/aaf-parser.js'
import { matchesAUID, isNullUMID, umidEquals } from '../../../src/lib/aaf/constants.js'
import { CLASS_AUIDS } from '../../../src/lib/aaf/constants.js'

describe('urlToPath', () => {
  it('handles file:/// URLs', () => {
    expect(urlToPath('file:///Users/foo/bar.wav')).toBe('/Users/foo/bar.wav')
  })

  it('handles file:// URLs (UNC path - no leading slash preserved)', () => {
    // file://server/share/file.wav strips "file://" leaving "server/share/file.wav"
    // This is a network path. The function strips the scheme.
    const result = urlToPath('file://server/share/file.wav')
    expect(result).toBe('server/share/file.wav')
  })

  it('handles plain paths', () => {
    expect(urlToPath('/Users/foo/bar.wav')).toBe('/Users/foo/bar.wav')
  })

  it('handles null', () => {
    expect(urlToPath(null)).toBeNull()
  })

  it('decodes URL-encoded characters', () => {
    expect(urlToPath('file:///Users/My%20Name/track.wav')).toBe('/Users/My Name/track.wav')
  })
})

describe('matchesAUID', () => {
  it('returns true for matching AUID', () => {
    const auid = [...CLASS_AUIDS.COMPOSITION_MOB]
    expect(matchesAUID(auid, CLASS_AUIDS.COMPOSITION_MOB)).toBe(true)
  })

  it('returns false for non-matching AUID', () => {
    const auid = [...CLASS_AUIDS.MASTER_MOB]
    expect(matchesAUID(auid, CLASS_AUIDS.COMPOSITION_MOB)).toBe(false)
  })

  it('returns false for null', () => {
    expect(matchesAUID(null, CLASS_AUIDS.COMPOSITION_MOB)).toBe(false)
  })

  it('returns false for too-short array', () => {
    expect(matchesAUID([0x06, 0x0e], CLASS_AUIDS.COMPOSITION_MOB)).toBe(false)
  })
})

describe('isNullUMID', () => {
  it('returns true for all-zero 32-byte UMID', () => {
    expect(isNullUMID(new Array(32).fill(0))).toBe(true)
  })

  it('returns false for non-zero UMID', () => {
    const umid = new Array(32).fill(0)
    umid[0] = 1
    expect(isNullUMID(umid)).toBe(false)
  })

  it('returns true for null', () => {
    expect(isNullUMID(null)).toBe(true)
  })

  it('returns true for short array', () => {
    expect(isNullUMID([0, 0])).toBe(true)
  })
})

describe('umidEquals', () => {
  it('returns true for equal UMIDs', () => {
    const umid = Array.from({ length: 32 }, (_, i) => i)
    expect(umidEquals(umid, [...umid])).toBe(true)
  })

  it('returns false for different UMIDs', () => {
    const a = new Array(32).fill(0)
    const b = new Array(32).fill(0)
    b[5] = 1
    expect(umidEquals(a, b)).toBe(false)
  })

  it('returns false for null', () => {
    expect(umidEquals(null, new Array(32).fill(0))).toBe(false)
  })
})

describe('parseAAFFile error handling', () => {
  it('throws on non-CFB data', async () => {
    const { parseAAFFile } = await import('../../../src/lib/aaf/aaf-parser.js')
    const badData = new ArrayBuffer(100)
    expect(() => parseAAFFile(badData)).toThrow()
  })

  it('throws on empty buffer', async () => {
    const { parseAAFFile } = await import('../../../src/lib/aaf/aaf-parser.js')
    const empty = new ArrayBuffer(0)
    expect(() => parseAAFFile(empty)).toThrow()
  })
})
