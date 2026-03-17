<template>
  <div class="app">
    <header class="app__header">
      <div class="app__header-content">
        <div class="app__logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
        </div>
        <div class="app__title-group">
          <h1 class="app__title">AAF → Ableton Converter</h1>
          <p class="app__subtitle">DaVinci Resolve AAF to Ableton Live Set (.als)</p>
        </div>
        <div class="app__version">v1.0.0</div>
      </div>
    </header>

    <main class="app__main">
      <div class="app__content">

        <!-- Step 1: File Upload -->
        <section class="app__section">
          <div class="app__section-label">
            <span class="app__step-num">01</span>
            Load AAF File
          </div>
          <FileDropzone
            v-model:file="aafFile"
            :error="fileError"
            @error="fileError = $event"
          />
        </section>

        <!-- Step 2: Convert & Download -->
        <section class="app__section">
          <div class="app__section-label">
            <span class="app__step-num">02</span>
            Convert
          </div>
          <DownloadPanel
            :status="conversionStatus"
            :progress="conversionProgress"
            :can-convert="!!aafFile && !fileError"
            :stats="conversionStats"
            :error-message="conversionError"
            @convert="startConversion"
            @download="downloadResult"
            @reset="resetConversion"
          />
        </section>

        <!-- Track Preview (shows after parsing) -->
        <section class="app__section" v-if="parsedTimeline">
          <div class="app__section-label">
            <span class="app__step-num">03</span>
            Timeline Preview
          </div>
          <TrackPreview :timeline="parsedTimeline" />
        </section>

      </div>

      <!-- Info Panel -->
      <aside class="app__sidebar">
        <div class="info-panel">
          <h3 class="info-panel__title">About</h3>
          <p class="info-panel__text">
            Converts AAF (Advanced Authoring Format) files from
            <strong>DaVinci Resolve</strong> into Ableton Live Set
            (<strong>.als</strong>) files, preserving track layout and clip positions.
          </p>

          <div class="info-panel__divider"></div>

          <h4 class="info-panel__subtitle">What gets converted</h4>
          <ul class="info-panel__list">
            <li>Audio tracks and clip positions</li>
            <li>Track names</li>
            <li>File references (paths to audio files)</li>
            <li>Timeline structure</li>
          </ul>

          <div class="info-panel__divider"></div>

          <h4 class="info-panel__subtitle">Notes</h4>
          <ul class="info-panel__list info-panel__list--notes">
            <li>Audio files must remain at their original paths</li>
            <li>MIDI tracks are not included</li>
            <li>Effects/plugins are not converted</li>
            <li>Works best with DaVinci Resolve AAF exports</li>
          </ul>

          <div class="info-panel__divider"></div>

          <h4 class="info-panel__subtitle">How to export AAF from DaVinci</h4>
          <ol class="info-panel__steps">
            <li>File → Export → AAF...</li>
            <li>Select "Consolidate Media" if needed</li>
            <li>Choose output location</li>
            <li>Drop the .aaf file here</li>
          </ol>
        </div>

        <!-- Format Reference -->
        <div class="format-ref" v-if="showFormatRef">
          <div class="format-ref__header" @click="showFormatRef = !showFormatRef">
            <h4 class="format-ref__title">Debug: XML Preview</h4>
            <button class="format-ref__close">×</button>
          </div>
          <pre class="format-ref__xml">{{ xmlPreview }}</pre>
        </div>

        <button
          v-if="generatedXML && !showFormatRef"
          class="xml-preview-btn"
          @click="showFormatRef = true"
        >
          View Generated XML
        </button>
      </aside>
    </main>

    <footer class="app__footer">
      <span>AAF → Ableton Converter</span>
      <span class="app__footer-sep">·</span>
      <span>Built with Vue 3 + cfb + pako</span>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import FileDropzone from './components/FileDropzone.vue'
import TrackPreview from './components/TrackPreview.vue'
import DownloadPanel from './components/DownloadPanel.vue'
import { convertAAFtoALS } from './lib/converter/aaf-to-als.js'
import { downloadBlob } from './utils/compression.js'

const aafFile = ref(null)
const fileError = ref('')


const conversionStatus = ref('idle') // 'idle' | 'converting' | 'done' | 'error'
const conversionProgress = ref(0)
const conversionStats = ref(null)
const conversionError = ref('')
const parsedTimeline = ref(null)
const resultBlob = ref(null)
const generatedXML = ref('')
const showFormatRef = ref(false)

const xmlPreview = computed(() => {
  if (!generatedXML.value) return ''
  // Show first 3000 chars
  return generatedXML.value.substring(0, 3000) + (generatedXML.value.length > 3000 ? '\n...' : '')
})

async function startConversion() {
  if (!aafFile.value) return

  conversionStatus.value = 'converting'
  conversionProgress.value = 0
  conversionError.value = ''
  parsedTimeline.value = null

  try {
    const arrayBuffer = await aafFile.value.arrayBuffer()

    const result = await convertAAFtoALS(arrayBuffer, {
      onProgress: (p) => { conversionProgress.value = p },
    })

    parsedTimeline.value = result.timeline
    resultBlob.value = result.blob
    generatedXML.value = result.xml
    conversionStats.value = result.stats
    conversionStatus.value = 'done'

  } catch (e) {
    conversionStatus.value = 'error'
    conversionError.value = e.message || 'Unknown error'
    console.error('Conversion error:', e)
  }
}

function downloadResult() {
  if (!resultBlob.value || !aafFile.value) return
  const outputName = aafFile.value.name.replace(/\.aaf$/i, '') + '.zip'
  downloadBlob(resultBlob.value, outputName)
}

function resetConversion() {
  conversionStatus.value = 'idle'
  conversionProgress.value = 0
  conversionStats.value = null
  conversionError.value = ''
  parsedTimeline.value = null
  resultBlob.value = null
  generatedXML.value = ''
  showFormatRef.value = false
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');

:root {
  --bg-primary: #1e1f22;
  --bg-secondary: #2b2d30;
  --bg-elevated: #3c3f41;
  --border-color: #4e5157;
  --text-primary: #bcbec4;
  --text-secondary: #6e7074;
  --text-disabled: #4e5157;
  --accent-blue: #4f8cc9;
  --accent-blue-hover: #5a9bd6;
  --accent-green: #6aab73;
  --accent-red: #cc666e;
  --accent-orange: #c77b3f;
  --accent-yellow: #d9b44a;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app__header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}

.app__header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.875rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.app__logo {
  color: var(--accent-blue);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.app__title-group {
  flex: 1;
}

.app__title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-mono);
  line-height: 1.2;
}

.app__subtitle {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  margin-top: 0.1rem;
}

.app__version {
  font-size: 0.7rem;
  color: var(--text-disabled);
  font-family: var(--font-mono);
  background: var(--bg-elevated);
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  border: 1px solid var(--border-color);
}

.app__main {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
  width: 100%;
}

@media (max-width: 900px) {
  .app__main {
    grid-template-columns: 1fr;
  }
}

.app__content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.app__section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.app__section-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-family: var(--font-mono);
}

.app__step-num {
  background: var(--bg-elevated);
  color: var(--accent-blue);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  border: 1px solid var(--border-color);
}

.app__sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem;
}

.info-panel__title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-mono);
  margin-bottom: 0.75rem;
}

.info-panel__subtitle {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
}

.info-panel__text {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.info-panel__text strong {
  color: var(--text-primary);
}

.info-panel__divider {
  height: 1px;
  background: var(--border-color);
  margin: 1rem 0;
}

.info-panel__list {
  padding-left: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.info-panel__list li {
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.info-panel__list--notes li {
  color: var(--text-disabled);
}

.info-panel__steps {
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.info-panel__steps li {
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.format-ref {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.format-ref__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
}

.format-ref__title {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.format-ref__close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
}

.format-ref__xml {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--text-secondary);
  padding: 0.75rem 1rem;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
  white-space: pre;
  line-height: 1.5;
}

.xml-preview-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  padding: 0.5rem 1rem;
  text-align: center;
  transition: all 0.2s;
}

.xml-preview-btn:hover {
  color: var(--accent-blue);
  border-color: var(--accent-blue);
}

.app__footer {
  border-top: 1px solid var(--border-color);
  padding: 0.75rem 1.5rem;
  font-size: 0.72rem;
  color: var(--text-disabled);
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.app__footer-sep {
  color: var(--border-color);
}
</style>
