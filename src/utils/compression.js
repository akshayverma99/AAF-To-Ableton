/**
 * Gzip compression utilities using pako.
 * Ableton .als files are gzip-compressed XML.
 */
import pako from 'pako'

/**
 * Compress a string to a gzip Uint8Array.
 * @param {string} xmlString - The XML string to compress
 * @returns {Uint8Array} Gzip-compressed data
 */
export function gzipString(xmlString) {
  const encoder = new TextEncoder()
  const utf8Bytes = encoder.encode(xmlString)
  return pako.gzip(utf8Bytes)
}

/**
 * Decompress a gzip Uint8Array to a string.
 * @param {Uint8Array} compressed - Gzip-compressed data
 * @returns {string} Decompressed string
 */
export function gunzipToString(compressed) {
  const decompressed = pako.ungzip(compressed)
  const decoder = new TextDecoder('utf-8')
  return decoder.decode(decompressed)
}

/**
 * Create a downloadable Blob from a gzip-compressed Uint8Array.
 * @param {Uint8Array} data - Compressed data
 * @returns {Blob}
 */
export function createALSBlob(data) {
  return new Blob([data], { type: 'application/octet-stream' })
}

/**
 * Trigger a file download in the browser.
 * @param {Blob} blob - The file data
 * @param {string} filename - The filename to use
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
