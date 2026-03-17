/**
 * AAF Parser – correctly parses AAF files with embedded audio.
 *
 * File structure assumed:
 *   Root Entry/Header-2/Content-3b03/
 *     Mobs-1901{N}/              ← mob storages
 *       properties               ← mob properties stream
 *       Slots-4403{M}/
 *         properties
 *         Segment-4803/
 *           properties
 *           Components-1001{K}/  ← sequence components
 *             properties
 *     EssenceData-1902{N}/
 *       properties
 *       Data-2702                ← raw WAV bytes
 *
 * Navigation and property parsing uses the CORRECT format:
 *   [1B byteOrder][1B version=0x20][2B count LE]
 *   [count × 6B headers: PID(2) StoredForm(2) Length(2)]
 *   [concatenated data blobs]
 */
import CFB from 'cfb'
import {
  tryParsePropertiesStream,
  parseUTF16String,
  readInt64LE,
  readInt32LE,
  readUInt32LE,
  umidToHex,
  isZeroUMID,
} from './property-stream.js'
import {
  PID_MOB_MOBID,
  PID_MOB_NAME,
  PID_MOB_SLOTS,
  PID_SLOT_EDITRATE,
  PID_SLOT_ORIGIN,
  PID_SLOT_SEGMENT,
  PID_SLOT_SLOTID,
  PID_COMP_LENGTH,
  PID_SRCREF_MOBID,
  PID_SRCREF_SLOTID,
  PID_SRCCLIP_START,
  PID_ESSDATA_MOBID,
} from './constants.js'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse an AAF file (ArrayBuffer or Buffer) and return a timeline model
 * suitable for .als generation plus an essenceMap for WAV extraction.
 *
 * Returns:
 * {
 *   name: string,
 *   tracks: [{ id, name, editRate: {num,den}, clips: [{
 *     positionBeats, durationBeats, inPointBeats, wavName, wavBytes?
 *   }] }],
 *   essenceMap: Map<umidHex, { wavBytes: Uint8Array, name: string }>,
 *   warnings: string[]
 * }
 */
export function parseAAFFile(arrayBuffer) {
  // Normalise input
  let ab
  if (arrayBuffer instanceof ArrayBuffer) {
    ab = arrayBuffer
  } else if (arrayBuffer.buffer instanceof ArrayBuffer) {
    // Node.js Buffer
    ab = arrayBuffer.buffer.slice(arrayBuffer.byteOffset, arrayBuffer.byteOffset + arrayBuffer.byteLength)
  } else {
    ab = arrayBuffer
  }

  const cfb = CFB.read(new Uint8Array(ab), { type: 'array' })
  const base = 'Root Entry/Header-2/Content-3b03'

  const warnings = []

  // ------------------------------------------------------------------
  // 1. Build essence map:  UMID hex -> { wavBytes, name }
  // ------------------------------------------------------------------
  const essenceMap = buildEssenceMap(cfb, base, warnings)

  // ------------------------------------------------------------------
  // 2. Build master-mob map:  UMID hex -> { name, mobPath }
  // ------------------------------------------------------------------
  const masterMobMap = buildMasterMobMap(cfb, base, essenceMap)

  // ------------------------------------------------------------------
  // 3. Find composition mob (the one with the most Slots-4403 children)
  // ------------------------------------------------------------------
  const compMob = findCompositionMob(cfb, base, warnings)
  if (!compMob) {
    throw new Error('No CompositionMob found in AAF file.')
  }

  // ------------------------------------------------------------------
  // 4. Extract audio tracks from the composition mob
  // ------------------------------------------------------------------
  const tracks = extractAudioTracks(cfb, base, compMob, masterMobMap, essenceMap, warnings)

  return {
    name:       compMob.name,
    tracks,
    essenceMap,
    warnings,
  }
}

// ---------------------------------------------------------------------------
// Step 1 – Build essence map
// ---------------------------------------------------------------------------

function buildEssenceMap(cfb, base, warnings) {
  // Map: umidHex -> { wavBytes: Uint8Array, name: string, essPath: string }
  const map = new Map()

  for (const fullPath of cfb.FullPaths) {
    // Match  .../EssenceData-1902{N}/properties
    const rel = stripBase(fullPath, base)
    if (!rel) continue
    if (!/^\/EssenceData-[0-9a-f]+\{[0-9a-f]+\}\/properties$/.test(rel)) continue

    const essStoragePath = fullPath.replace('/properties', '')
    const props = parseStream(cfb, fullPath)
    if (!props) continue

    const mobIdProp = props.get(PID_ESSDATA_MOBID)
    if (!mobIdProp) continue

    const umidHex = umidToHex(mobIdProp.data)

    // Read the Data-2702 stream
    const dataPath = essStoragePath + '/Data-2702'
    const wavBytes = getStreamContent(cfb, dataPath)
    if (!wavBytes) continue

    // Derive a preliminary name from the path (we'll update with MasterMob name later)
    const dirName = essStoragePath.split('/').pop()
    map.set(umidHex, { wavBytes, name: dirName, essPath: essStoragePath })
  }

  return map
}

// ---------------------------------------------------------------------------
// Step 2 – Build master mob map
// ---------------------------------------------------------------------------

function buildMasterMobMap(cfb, base, essenceMap) {
  // Map: umidHex -> { name, mobPath, sourceMobUMID }
  const map = new Map()

  for (const fullPath of cfb.FullPaths) {
    const rel = stripBase(fullPath, base)
    if (!rel) continue
    if (!/^\/Mobs-[0-9a-f]+\{[0-9a-f]+\}\/properties$/.test(rel)) continue

    const mobStoragePath = fullPath.replace('/properties', '')
    const props = parseStream(cfb, fullPath)
    if (!props) continue

    const mobIdProp = props.get(PID_MOB_MOBID)
    if (!mobIdProp) continue
    const umidHex = umidToHex(mobIdProp.data)

    const nameProp = props.get(PID_MOB_NAME)
    const name = nameProp ? parseUTF16String(nameProp.data) : ''

    // Determine if this is a MasterMob: no EssenceDescription child,
    // but has a slot whose Segment directly references another mob (SourceMob).
    // We detect SourceMobs by checking if essenceMap has their UMID.
    // For MasterMobs we resolve their SourceMob UMID here.

    // Check whether EssenceDescription exists (marks a SourceMob)
    const hasEssDesc = cfb.FullPaths.some(p =>
      p.startsWith(mobStoragePath + '/EssenceDescription')
    )
    if (hasEssDesc) continue  // SourceMob – skip

    // For MasterMobs, find the SourceMob UMID via the slot's Segment source ref
    // MasterMob slot{0}/Segment-4803 should have PID_SRCREF_MOBID
    let sourceMobUMID = null
    const slot0SegPath = mobStoragePath + '/Slots-4403{0}/Segment-4803'
    const segProps = parseStream(cfb, slot0SegPath + '/properties')
    if (segProps) {
      const srcRefProp = segProps.get(PID_SRCREF_MOBID)
      if (srcRefProp && !isZeroUMID(srcRefProp.data)) {
        sourceMobUMID = umidToHex(srcRefProp.data)
      }
    }

    if (!name && !sourceMobUMID) continue  // skip empty/unresolvable mobs

    map.set(umidHex, { name, mobPath: mobStoragePath, sourceMobUMID })
  }

  // Update essenceMap names with MasterMob names
  for (const [masterUMID, mm] of map) {
    if (mm.sourceMobUMID && mm.name) {
      const ess = essenceMap.get(mm.sourceMobUMID)
      if (ess) ess.name = mm.name
    }
  }

  return map
}

// ---------------------------------------------------------------------------
// Step 3 – Find composition mob
// ---------------------------------------------------------------------------

function findCompositionMob(cfb, base, warnings) {
  let bestMobPath = null
  let bestSlotCount = -1
  let bestName = ''

  for (const fullPath of cfb.FullPaths) {
    const rel = stripBase(fullPath, base)
    if (!rel) continue
    if (!/^\/Mobs-[0-9a-f]+\{[0-9a-f]+\}\/properties$/.test(rel)) continue

    const mobStoragePath = fullPath.replace('/properties', '')
    // Count direct Slots-4403{N} children
    const slotCount = countSlots(cfb, mobStoragePath)
    if (slotCount > bestSlotCount) {
      bestSlotCount = slotCount
      bestMobPath   = mobStoragePath
      const props   = parseStream(cfb, fullPath)
      const nameProp = props && props.get(PID_MOB_NAME)
      bestName = nameProp ? parseUTF16String(nameProp.data) : 'AAF Timeline'
    }
  }

  if (!bestMobPath) return null
  return { mobPath: bestMobPath, name: bestName, slotCount: bestSlotCount }
}

// ---------------------------------------------------------------------------
// Step 4 – Extract audio tracks
// ---------------------------------------------------------------------------

function extractAudioTracks(cfb, base, compMob, masterMobMap, essenceMap, warnings) {
  const tracks = []

  for (let slotIdx = 0; slotIdx < 500; slotIdx++) {
    const slotHex  = slotIdx.toString(16)
    const slotPath = compMob.mobPath + `/Slots-4403{${slotHex}}`
    const propsPath = slotPath + '/properties'

    if (!cfb.FullPaths.includes(propsPath)) break

    const sp = parseStream(cfb, propsPath)
    if (!sp) continue

    // EditRate
    const erProp = sp.get(PID_SLOT_EDITRATE)
    if (!erProp || erProp.data.length < 8) continue
    const editNum = readInt32LE(erProp.data, 0)
    const editDen = readInt32LE(erProp.data, 4)

    // Only audio slots (48000 or 44100 sample rate)
    if (editNum !== 48000 && editNum !== 44100) continue
    if (editDen !== 1) continue

    const editRate = { num: editNum, den: editDen }

    // Origin
    const originProp = sp.get(PID_SLOT_ORIGIN)
    const origin = originProp ? readInt64LE(originProp.data) : 0n

    // SlotID
    const slotIdProp = sp.get(PID_SLOT_SLOTID)
    const slotId = slotIdProp ? readUInt32LE(slotIdProp.data) : slotIdx + 1

    // Build clips from Segment/Components
    const clips = extractClipsFromSlot(
      cfb, slotPath, origin, editRate, masterMobMap, essenceMap, warnings
    )

    tracks.push({
      id:       slotId,
      name:     `Track ${slotId}`,
      editRate,
      clips,
    })
  }

  return tracks
}

// ---------------------------------------------------------------------------
// Extract clips from a single slot
// ---------------------------------------------------------------------------

function extractClipsFromSlot(cfb, slotPath, origin, editRate, masterMobMap, essenceMap, warnings) {
  const clips = []
  const segBase = slotPath + '/Segment-4803'

  let cursor = origin  // BigInt, in edit units

  for (let compIdx = 0; compIdx < 5000; compIdx++) {
    const compHex  = compIdx.toString(16)
    const compPath = segBase + `/Components-1001{${compHex}}`
    const propsPath = compPath + '/properties'

    if (!cfb.FullPaths.includes(propsPath)) break

    const cp = parseStream(cfb, propsPath)
    if (!cp) { cursor += 0n; continue }

    const lenProp = cp.get(PID_COMP_LENGTH)
    const compLen = lenProp ? readInt64LE(lenProp.data) : 0n

    // Try to get source reference directly (SourceClip), or from inside an
    // OperationGroup's first InputSegment (DaVinci Resolve wraps clips in effects).
    let srcMobProp = cp.get(PID_SRCREF_MOBID)
    let startPosPropSource = cp  // where to read PID_SRCCLIP_START from

    if (!srcMobProp || isZeroUMID(srcMobProp.data)) {
      // Try OperationGroup: look inside InputSegments-b02{0}
      const inSegPath = compPath + '/InputSegments-b02{0}/properties'
      if (cfb.FullPaths.includes(inSegPath)) {
        const icp = parseStream(cfb, inSegPath)
        if (icp) {
          const iSrcMob = icp.get(PID_SRCREF_MOBID)
          if (iSrcMob && !isZeroUMID(iSrcMob.data)) {
            srcMobProp = iSrcMob
            startPosPropSource = icp
          }
        }
      }
    }

    const isFiller = !srcMobProp || isZeroUMID(srcMobProp.data)

    if (!isFiller) {
      const masterMobUMIDhex = umidToHex(srcMobProp.data)
      const mm = masterMobMap.get(masterMobUMIDhex)

      // Start position within the source clip
      const startPosProp = startPosPropSource.get(PID_SRCCLIP_START)
      const startPos = startPosProp ? readInt64LE(startPosProp.data) : 0n

      // Resolve WAV
      let wavName = null
      let wavBytes = null

      if (mm) {
        // Look up SourceMob UMID from master mob
        if (mm.sourceMobUMID) {
          const ess = essenceMap.get(mm.sourceMobUMID)
          if (ess) {
            wavName  = sanitizeFilename(mm.name || ess.name) + '.wav'
            wavBytes = ess.wavBytes
          }
        }
        if (!wavName) {
          wavName = sanitizeFilename(mm.name) + '.wav'
        }
      } else {
        warnings.push(`MasterMob not found for UMID ${masterMobUMIDhex.substring(0, 32)}`)
      }

      // Convert to seconds at 60 BPM (1 beat = 1 second)
      const rate = editRate.num / editRate.den
      const positionBeats  = Number(cursor)   / rate
      const durationBeats  = Number(compLen)  / rate
      const inPointBeats   = Number(startPos) / rate

      if (durationBeats > 0) {
        clips.push({
          positionBeats,
          durationBeats,
          inPointBeats,
          wavName,
          wavBytes,
          // Legacy fields for als-generator compatibility
          startTime:     Number(cursor),
          length:        Number(compLen),
          startPosition: Number(startPos),
          filePath:      wavName ? `Samples/imported/${wavName}` : '',
          trackName:     wavName ? wavName.replace(/\.wav$/i, '') : 'clip',
        })
      }
    }

    cursor += compLen
  }

  return clips
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseStream(cfb, fullPath) {
  const idx = cfb.FullPaths.indexOf(fullPath)
  if (idx < 0) return null
  const entry = cfb.FileIndex[idx]
  if (!entry || entry.type !== 2) return null
  const bytes = toUint8Array(entry.content)
  return tryParsePropertiesStream(bytes)
}

function getStreamContent(cfb, fullPath) {
  const idx = cfb.FullPaths.indexOf(fullPath)
  if (idx < 0) return null
  const entry = cfb.FileIndex[idx]
  if (!entry || entry.type !== 2) return null
  return toUint8Array(entry.content)
}

function toUint8Array(content) {
  if (!content) return null
  if (content instanceof Uint8Array) {
    const ab = content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength)
    return new Uint8Array(ab)
  }
  if (Array.isArray(content)) return new Uint8Array(content)
  if (content instanceof ArrayBuffer) return new Uint8Array(content)
  try { return new Uint8Array(content) } catch { return null }
}

function stripBase(fullPath, base) {
  if (!fullPath.startsWith(base)) return null
  return fullPath.slice(base.length)
}

function countSlots(cfb, mobStoragePath) {
  let count = 0
  const prefix = mobStoragePath + '/Slots-4403{'
  for (const p of cfb.FullPaths) {
    if (p.startsWith(prefix) && p.endsWith('/properties')) {
      // Only direct slot children (one level deep: Mobs-X{N}/Slots-4403{M}/properties)
      const rel = p.slice(mobStoragePath.length + 1)
      if (/^Slots-4403\{[0-9a-f]+\}\/properties$/.test(rel)) count++
    }
  }
  return count
}

function sanitizeFilename(name) {
  if (!name) return 'clip'
  return name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'clip'
}
