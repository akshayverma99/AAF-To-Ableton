<template>
  <div class="app">

    <header class="app__header">
      <div class="app__header-inner">
        <div class="app__flow">
          <span class="app__flow-from">DaVinci Resolve</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
          <span class="app__flow-to">Ableton Live</span>
        </div>
      </div>
    </header>

    <main class="app__main">

      <section class="app__hero">
        <h1 class="app__title">Convert AAF to ALS</h1>
        <p class="app__subtitle">Drop your DaVinci Resolve AAF export and get an Ableton Live set in seconds.</p>
      </section>

      <div class="app__card">
        <div class="app__card-header">
          <span class="app__card-label">Upload File</span>
        </div>
        <FileDropzone
          v-model:file="aafFile"
          :error="fileError"
          @error="fileError = $event"
        />
        <div class="app__action">
          <button
            class="app__run-btn"
            :disabled="!aafFile || !!fileError || conversionStatus === 'converting'"
            @click="startConversion"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Run Conversion
          </button>
          <p v-if="!aafFile || fileError" class="app__action-hint">Load an AAF file above to continue</p>
        </div>
      </div>

      <div v-if="conversionStatus !== 'idle'" class="app__card">
        <div class="app__card-header">
          <span class="app__card-label">{{ conversionStatus === 'converting' ? 'Processing' : conversionStatus === 'done' ? 'Complete' : 'Error' }}</span>
          <span v-if="conversionStatus === 'converting'" class="app__card-status app__card-status--active">
            <span class="app__card-dot"></span>
            Running
          </span>
          <span v-else-if="conversionStatus === 'done'" class="app__card-status app__card-status--done">Done</span>
          <span v-else class="app__card-status app__card-status--error">Failed</span>
        </div>
        <DownloadPanel
          :status="conversionStatus"
          :progress="conversionProgress"
          :stats="conversionStats"
          :error-message="conversionError"
          @download="downloadResult"
          @reset="resetConversion"
        />
      </div>

      <div v-if="parsedTimeline" class="app__card">
        <div class="app__card-header">
          <span class="app__card-label">Timeline Preview</span>
          <span class="app__card-meta">{{ parsedTimeline.tracks.length }} tracks</span>
        </div>
        <TrackPreview :timeline="parsedTimeline" :stats="conversionStats" />
      </div>

    </main>

    <footer class="app__footer">
      <span>Built with Vue 3 · cfb · pako · JSZip</span>
    </footer>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import FileDropzone from './components/FileDropzone.vue'
import TrackPreview from './components/TrackPreview.vue'
import DownloadPanel from './components/DownloadPanel.vue'
import { convertAAFtoALS } from './lib/converter/aaf-to-als.js'
import { downloadBlob } from './utils/compression.js'

const aafFile          = ref(null)
const fileError        = ref('')
const conversionStatus = ref('idle')
const conversionProgress = ref(0)
const conversionStats  = ref(null)
const conversionError  = ref('')
const parsedTimeline   = ref(null)
const resultBlob       = ref(null)

async function startConversion() {
  if (!aafFile.value) return
  conversionStatus.value  = 'converting'
  conversionProgress.value = 0
  conversionError.value   = ''
  parsedTimeline.value    = null

  try {
    const arrayBuffer = await aafFile.value.arrayBuffer()
    const result = await convertAAFtoALS(arrayBuffer, {
      onProgress: (p) => { conversionProgress.value = p },
    })
    parsedTimeline.value   = result.timeline
    resultBlob.value       = result.blob
    conversionStats.value  = result.stats
    conversionStatus.value = 'done'
  } catch (e) {
    conversionStatus.value = 'error'
    conversionError.value  = e.message || 'Unknown error'
  }
}

function downloadResult() {
  if (!resultBlob.value || !aafFile.value) return
  downloadBlob(resultBlob.value, aafFile.value.name.replace(/\.aaf$/i, '') + '.zip')
}

function resetConversion() {
  conversionStatus.value   = 'idle'
  conversionProgress.value = 0
  conversionStats.value    = null
  conversionError.value    = ''
  parsedTimeline.value     = null
  resultBlob.value         = null
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

:root {
  --bg:           #111111;
  --bg-panel:     #1a1a1a;
  --bg-elevated:  #202020;
  --bg-deep:      #0d0d0d;
  --bg-card:      #181818;

  --border:       #252525;
  --border-mid:   #2e2e2e;
  --border-bright:#444444;

  --accent:       #ff6b00;
  --accent-dim:   rgba(255, 107, 0, 0.1);
  --accent-glow:  rgba(255, 107, 0, 0.2);
  --accent-border:rgba(255, 107, 0, 0.3);

  --warm:         #ff8c42;
  --warm-dim:     rgba(255, 140, 66, 0.12);

  --amber:        #ffb347;
  --amber-dim:    rgba(255, 179, 71, 0.1);

  /* keep legacy names for child components */
  --green:        #ff6b00;
  --green-dim:    rgba(255, 107, 0, 0.1);
  --green-glow:   rgba(255, 107, 0, 0.2);
  --yellow:       #ff8c42;
  --yellow-dim:   rgba(255, 140, 66, 0.12);
  --cyan:         #ffb347;
  --cyan-dim:     rgba(255, 179, 71, 0.1);

  --red:          #f03e3e;
  --red-dim:      rgba(240, 62, 62, 0.1);

  --text:         #b8b8b8;
  --text-dim:     #666666;
  --text-muted:   #3d3d3d;
  --text-bright:  #f0f0f0;

  --font:         'Inter', system-ui, sans-serif;
  --mono:         'JetBrains Mono', 'Fira Code', monospace;

  --radius:       10px;
  --radius-sm:    6px;
  --radius-lg:    14px;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body { height: 100%; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  font-size: 14px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

#app { min-height: 100vh; }

.mono { font-family: var(--mono); }

code.inline-code {
  font-family: var(--mono);
  font-size: 0.85em;
  background: var(--bg-elevated);
  border: 1px solid var(--border-mid);
  padding: 0.05em 0.4em;
  border-radius: 4px;
  color: var(--amber);
}

::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-mid); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-bright); }
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── HEADER ── */
.app__header {
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: rgba(17, 17, 17, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 100;
}

.app__header-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 2rem;
  height: 56px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.app__brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.app__brand-mark {
  width: 30px;
  height: 30px;
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
}

.app__brand-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-bright);
  letter-spacing: -0.01em;
}

.app__flow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-dim);
}

.app__flow-to {
  color: var(--accent);
  font-weight: 600;
}

.app__flow svg {
  color: var(--text-muted);
}

.app__version {
  font-size: 0.7rem;
  font-family: var(--mono);
  color: var(--text-muted);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  padding: 0.2rem 0.55rem;
  border-radius: 20px;
}

/* ── MAIN ── */
.app__main {
  flex: 1;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  padding: 3rem 2rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── HERO ── */
.app__hero {
  margin-bottom: 0.5rem;
}

.app__title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-bright);
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

.app__subtitle {
  font-size: 0.9rem;
  color: var(--text-dim);
  max-width: 480px;
  line-height: 1.6;
}

/* ── CARDS ── */
.app__card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.app__card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid var(--border);
}

.app__card-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.app__card-meta {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-family: var(--mono);
}

.app__card-status {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
}

.app__card-status--active {
  color: var(--warm);
  background: var(--warm-dim);
  border: 1px solid rgba(255, 140, 66, 0.2);
}

.app__card-status--done {
  color: var(--accent);
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
}

.app__card-status--error {
  color: var(--red);
  background: var(--red-dim);
  border: 1px solid rgba(240, 62, 62, 0.2);
}

.app__card-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--warm);
  animation: pulse-dot 1.4s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

/* ── RUN BUTTON ── */
.app__action {
  padding: 1.25rem;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.app__run-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--accent);
  border: none;
  color: #fff;
  font-family: var(--font);
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.65rem 1.5rem;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s, opacity 0.15s;
  letter-spacing: -0.01em;
  border-radius: var(--radius-sm);
}

.app__run-btn:not(:disabled):hover {
  background: color-mix(in srgb, var(--accent) 85%, white 15%);
  box-shadow: 0 0 24px var(--accent-glow), 0 4px 12px rgba(255, 107, 0, 0.3);
}

.app__run-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.app__action-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
}

/* ── FOOTER ── */
.app__footer {
  border-top: 1px solid var(--border);
  padding: 1rem 2rem;
  text-align: center;
  font-size: 0.72rem;
  color: var(--text-muted);
}
</style>
