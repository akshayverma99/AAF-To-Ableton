/**
 * Main conversion orchestrator: AAF file → ZIP containing .als + WAV files
 *
 * Output ZIP structure:
 *   ProjectName.als
 *   Samples/imported/ClipName.wav   (one per unique embedded audio file)
 */
import JSZip from 'jszip'
import { parseAAFFile } from '../aaf/aaf-parser.js'
import { generateALSXML } from '../ableton/als-generator.js'
import { gzipString, downloadBlob } from '../../utils/compression.js'

// 60 BPM: 1 beat = 1 second, so positions in seconds map directly to beats.
const INTERNAL_TEMPO = 60

/**
 * Convert an AAF ArrayBuffer to a ZIP Blob containing:
 *  - ProjectName.als  (gzip-compressed Ableton XML)
 *  - Samples/imported/*.wav  (extracted embedded audio)
 *
 * @param {ArrayBuffer} arrayBuffer  Raw AAF file data
 * @param {object}      options
 * @param {string}      [options.projectName]  Base name for the .als file
 * @param {function}    [options.onProgress]   Progress callback (0-1)
 * @returns {{ blob: Blob, timeline: object, xml: string, warnings: string[], stats: object }}
 */
export async function convertAAFtoALS(arrayBuffer, options = {}) {
  const { onProgress = null, projectName = 'Project' } = options

  const tempo               = INTERNAL_TEMPO
  const sampleRate          = 48000
  const timeSignatureNumerator   = 4
  const timeSignatureDenominator = 4

  const warnings = []

  // ── Step 1: Parse AAF ──────────────────────────────────────────────────────
  if (onProgress) onProgress(0.1)

  let timeline
  try {
    timeline = parseAAFFile(arrayBuffer)
  } catch (e) {
    throw new Error('AAF parsing failed: ' + e.message)
  }

  if (timeline.warnings && timeline.warnings.length > 0) {
    warnings.push(...timeline.warnings)
  }

  if (onProgress) onProgress(0.4)

  // ── Step 2: Generate ALS XML ──────────────────────────────────────────────
  let xml
  try {
    xml = generateALSXML(timeline, {
      tempo,
      sampleRate,
      timeSignatureNumerator,
      timeSignatureDenominator,
    })
  } catch (e) {
    throw new Error('ALS generation failed: ' + e.message)
  }

  if (onProgress) onProgress(0.6)

  // ── Step 3: Gzip-compress the XML ─────────────────────────────────────────
  let compressed
  try {
    compressed = gzipString(xml)
  } catch (e) {
    throw new Error('Compression failed: ' + e.message)
  }

  // ── Step 4: Build ZIP ─────────────────────────────────────────────────────
  if (onProgress) onProgress(0.7)

  const alsName = sanitizeFilename(timeline.name || projectName) + '.als'

  const zip = new JSZip()
  zip.file(alsName, compressed)

  // Always include the Samples/imported folder so users can drag-and-drop audio
  zip.folder('Samples/imported')

  // Collect unique WAV files (multiple clips can share the same WAV)
  const addedWavs = new Set()
  for (const track of timeline.tracks) {
    for (const clip of track.clips || []) {
      if (clip.wavName && clip.wavBytes && !addedWavs.has(clip.wavName)) {
        zip.file(`Samples/imported/${clip.wavName}`, clip.wavBytes)
        addedWavs.add(clip.wavName)
      }
    }
  }

  if (addedWavs.size === 0) {
    warnings.push('No embedded audio found in this AAF. Place your WAV files in the Samples/imported/ folder next to the .als file.')
  }

  if (onProgress) onProgress(0.9)

  const zipBlob = await zip.generateAsync({
    type:       'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  if (onProgress) onProgress(1.0)

  return {
    blob: zipBlob,
    timeline,
    xml,
    warnings,
    stats: {
      trackCount:   timeline.tracks.length,
      clipCount:    timeline.tracks.reduce((s, t) => s + (t.clips ? t.clips.length : 0), 0),
      wavCount:     addedWavs.size,
      timelineName: timeline.name,
      alsName,
    },
  }
}

/**
 * Convert AAF file and trigger browser download of the ZIP.
 */
export async function convertAndDownload(file, options = {}) {
  const arrayBuffer = await file.arrayBuffer()
  const result = await convertAAFtoALS(arrayBuffer, {
    ...options,
    projectName: file.name.replace(/\.aaf$/i, ''),
  })

  const outputName = file.name.replace(/\.aaf$/i, '') + '.zip'
  downloadBlob(result.blob, outputName)

  return result
}

/**
 * Validate that an ArrayBuffer looks like an AAF (OLE2 CFB) file.
 */
export function validateAAFFile(arrayBuffer) {
  if (!arrayBuffer || arrayBuffer.byteLength < 8) return false
  const bytes  = new Uint8Array(arrayBuffer)
  const magic  = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]
  return magic.every((b, i) => bytes[i] === b)
}

function sanitizeFilename(name) {
  if (!name) return 'Project'
  return name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'Project'
}
