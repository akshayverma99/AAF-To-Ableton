import { describe, it, expect, beforeEach } from 'vitest'
import { generateALSXML } from '../../../src/lib/ableton/als-generator.js'
import { editUnitsToBeat, resetIdCounter } from '../../../src/lib/ableton/track-builder.js'

describe('editUnitsToBeat', () => {
  it('converts at 48000 edit rate, 120 BPM', () => {
    // 48000 edit units = 1 second = 2 beats at 120 BPM
    const beats = editUnitsToBeat(48000, { numerator: 48000, denominator: 1 }, 120)
    expect(beats).toBeCloseTo(2, 5)
  })

  it('converts at 25 fps, 120 BPM', () => {
    // 25 edit units = 1 second = 2 beats at 120 BPM
    const beats = editUnitsToBeat(25, { numerator: 25, denominator: 1 }, 120)
    expect(beats).toBeCloseTo(2, 5)
  })

  it('returns 0 for zero edit rate denominator', () => {
    const beats = editUnitsToBeat(100, { numerator: 25, denominator: 0 }, 120)
    expect(beats).toBe(0)
  })

  it('returns 0 for zero edit units', () => {
    const beats = editUnitsToBeat(0, { numerator: 48000, denominator: 1 }, 120)
    expect(beats).toBe(0)
  })

  it('handles 24fps at 100 BPM', () => {
    // 24 EU = 1 sec, 100 BPM = 100/60 beats per sec
    const beats = editUnitsToBeat(24, { numerator: 24, denominator: 1 }, 100)
    expect(beats).toBeCloseTo(100 / 60, 5)
  })
})

describe('generateALSXML', () => {
  beforeEach(() => {
    resetIdCounter(100)
  })

  const makeTimeline = (tracks = []) => ({
    name: 'Test Timeline',
    editRate: { numerator: 48000, denominator: 1 },
    tracks,
    warnings: [],
  })

  it('generates valid XML string', () => {
    const xml = generateALSXML(makeTimeline())
    expect(typeof xml).toBe('string')
    expect(xml).toContain('<?xml version="1.0"')
    expect(xml).toContain('<Ableton')
    expect(xml).toContain('<LiveSet>')
    expect(xml).toContain('</Ableton>')
  })

  it('includes MajorVersion="5" (internal Ableton 11 format version)', () => {
    const xml = generateALSXML(makeTimeline())
    expect(xml).toContain('MajorVersion="5"')
    expect(xml).toContain('MinorVersion="11.0_433"')
  })

  it('includes Tempo element with correct BPM', () => {
    const xml = generateALSXML(makeTimeline(), { tempo: 140 })
    expect(xml).toContain('Value="140"')
  })

  it('generates AudioTrack for each track', () => {
    const timeline = makeTimeline([
      {
        id: 1,
        name: 'Audio 1',
        isAudio: true,
        editRate: { numerator: 48000, denominator: 1 },
        clips: [],
      },
      {
        id: 2,
        name: 'Audio 2',
        isAudio: true,
        editRate: { numerator: 48000, denominator: 1 },
        clips: [],
      },
    ])
    const xml = generateALSXML(timeline)
    const trackCount = (xml.match(/<AudioTrack /g) || []).length
    expect(trackCount).toBe(2)
  })

  it('includes track names', () => {
    const timeline = makeTimeline([{
      id: 1,
      name: 'MyTrack',
      isAudio: true,
      editRate: { numerator: 48000, denominator: 1 },
      clips: [],
    }])
    const xml = generateALSXML(timeline)
    expect(xml).toContain('Value="MyTrack"')
  })

  it('includes AudioClip for clips', () => {
    const timeline = makeTimeline([{
      id: 1,
      name: 'Track 1',
      isAudio: true,
      editRate: { numerator: 48000, denominator: 1 },
      clips: [{
        startTime: 0,
        length: 48000,  // 1 second
        startPosition: 0,
        filePath: '/path/to/audio.wav',
        trackName: 'Clip 1',
      }],
    }])
    const xml = generateALSXML(timeline, { tempo: 120 })
    expect(xml).toContain('<AudioClip')
    expect(xml).toContain('/path/to/audio.wav')
  })

  it('correctly converts clip times to beats at 120 BPM', () => {
    // 48000 EU at 48000 Hz = 1 second = 2 beats at 120 BPM
    const timeline = makeTimeline([{
      id: 1,
      name: 'Track 1',
      isAudio: true,
      editRate: { numerator: 48000, denominator: 1 },
      clips: [{
        startTime: 48000,
        length: 96000,
        startPosition: 0,
        filePath: '/audio.wav',
        trackName: 'My Clip',
      }],
    }])
    const xml = generateALSXML(timeline, { tempo: 120 })
    // Start at 2 beats, end at 6 beats
    expect(xml).toContain('Time="2"')
    expect(xml).toContain('CurrentStart Value="2"')
    expect(xml).toContain('CurrentEnd Value="6"')
  })

  it('escapes XML special characters in paths', () => {
    const timeline = makeTimeline([{
      id: 1,
      name: 'Track & More',
      isAudio: true,
      editRate: { numerator: 48000, denominator: 1 },
      clips: [{
        startTime: 0,
        length: 48000,
        startPosition: 0,
        filePath: '/path/to/file <1>.wav',
        trackName: 'Clip',
      }],
    }])
    const xml = generateALSXML(timeline)
    expect(xml).toContain('&amp;')
    expect(xml).toContain('&lt;')
    expect(xml).toContain('&gt;')
  })

  it('includes MasterTrack', () => {
    const xml = generateALSXML(makeTimeline())
    expect(xml).toContain('<MasterTrack>')
  })

  it('includes Transport section', () => {
    const xml = generateALSXML(makeTimeline())
    expect(xml).toContain('<Transport>')
    expect(xml).toContain('<LoopOn Value="false"')
  })

  it('includes TimeSignature in clips', () => {
    const timeline = makeTimeline([{
      id: 1,
      name: 'T1',
      isAudio: true,
      editRate: { numerator: 48000, denominator: 1 },
      clips: [{ positionBeats: 0, durationBeats: 4, inPointBeats: 0 }],
    }])
    const xml = generateALSXML(timeline, {
      timeSignatureNumerator: 3,
      timeSignatureDenominator: 4,
    })
    expect(xml).toContain('<Numerator Value="3"')
    expect(xml).toContain('<Denominator Value="4"')
  })

  it('generates unique AutomationTarget IDs across tracks', () => {
    resetIdCounter(1)
    const timeline = makeTimeline([
      { id: 0, name: 'T1', isAudio: true, editRate: { numerator: 48000, denominator: 1 }, clips: [] },
      { id: 1, name: 'T2', isAudio: true, editRate: { numerator: 48000, denominator: 1 }, clips: [] },
    ])
    const xml = generateALSXML(timeline)

    // Extract AutomationTarget Id="N" values only — these must be unique
    const autoIds = [...xml.matchAll(/AutomationTarget Id="(\d+)"/g)].map(m => m[1])
    const uniqueAutoIds = new Set(autoIds)
    // All automation IDs must be unique
    expect(autoIds.length).toBe(uniqueAutoIds.size)
    expect(autoIds.length).toBeGreaterThan(0)
  })
})
