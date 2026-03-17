/**
 * CFB Navigator – thin wrappers over the cfb (SheetJS) library.
 *
 * Navigation is purely path-based:  we look up entries by their full path
 * string, which is fast and unambiguous.
 */
import CFB from 'cfb'

/**
 * Read a CFB container from an ArrayBuffer (or Uint8Array).
 * Returns the raw cfb object from the cfb library.
 */
export function readCFB(arrayBuffer) {
  let bytes
  if (arrayBuffer instanceof Uint8Array) {
    bytes = arrayBuffer
  } else if (arrayBuffer instanceof ArrayBuffer) {
    bytes = new Uint8Array(arrayBuffer)
  } else {
    bytes = new Uint8Array(arrayBuffer)
  }
  return CFB.read(bytes, { type: 'array' })
}

/**
 * Return the content of a CFB stream entry as a Uint8Array, or null.
 * The cfb library may return arrays, Buffers, or TypedArrays – we normalise.
 */
export function getStreamContent(cfb, fullPath) {
  const idx = cfb.FullPaths.indexOf(fullPath)
  if (idx < 0) return null
  const entry = cfb.FileIndex[idx]
  if (!entry || entry.type !== 2) return null   // type 2 = stream
  return toUint8Array(entry.content)
}

/**
 * Coerce whatever the cfb library returns into a Uint8Array.
 * Uses the DataView-safe slice technique to avoid SharedArrayBuffer issues.
 */
export function toUint8Array(content) {
  if (!content) return null
  if (content instanceof Uint8Array) {
    // Re-slice to own buffer so DataView construction is always safe
    const ab = content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength)
    return new Uint8Array(ab)
  }
  if (Array.isArray(content)) return new Uint8Array(content)
  if (content instanceof ArrayBuffer) return new Uint8Array(content)
  try { return new Uint8Array(content) } catch { return null }
}

/**
 * Return an array of full paths that are immediate children of parentPath
 * and whose entry name matches the given prefix pattern.
 *
 * e.g. listChildPaths(cfb, 'Root Entry/Header-2/Content-3b03', 'Mobs-1901')
 *   → ['Root Entry/Header-2/Content-3b03/Mobs-1901{0}/',
 *       'Root Entry/Header-2/Content-3b03/Mobs-1901{1}/', ...]
 *
 * Only returns storage (directory) entries when onlyDirectories is true,
 * only stream entries when false, and both when null.
 */
export function listChildPaths(cfb, parentPath, namePrefix = '', onlyDirectories = null) {
  const prefix = parentPath.endsWith('/') ? parentPath : parentPath + '/'
  const result = []
  for (let i = 0; i < cfb.FullPaths.length; i++) {
    const p = cfb.FullPaths[i]
    if (!p.startsWith(prefix)) continue
    // Only direct children
    const rest = p.slice(prefix.length)
    if (!rest) continue
    // A direct child has no further '/' except possibly a trailing one
    const stripped = rest.endsWith('/') ? rest.slice(0, -1) : rest
    if (stripped.includes('/')) continue   // grandchild or deeper
    if (namePrefix && !stripped.startsWith(namePrefix)) continue
    if (onlyDirectories === true  && cfb.FileIndex[i].type !== 1) continue
    if (onlyDirectories === false && cfb.FileIndex[i].type !== 2) continue
    result.push(p)
  }
  return result
}

/**
 * List all full paths in the CFB for debugging.
 */
export function listAllPaths(cfb) {
  return cfb.FullPaths.map((path, i) => ({
    path,
    type: cfb.FileIndex[i].type,
    size: cfb.FileIndex[i].content ? cfb.FileIndex[i].content.length : 0,
  }))
}
