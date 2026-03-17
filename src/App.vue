<template>
  <div class="terminal">

    <header class="terminal__header">
      <div class="terminal__header-inner">
        <div class="terminal__brand">
          <span class="terminal__brand-prefix">~/</span>
          <span class="terminal__brand-name">aaf-to-als</span>
        </div>
        <div class="terminal__header-center">
          <span class="terminal__tag">DaVinci Resolve</span>
          <span class="terminal__arrow">→</span>
          <span class="terminal__tag terminal__tag--green">Ableton Live</span>
        </div>
        <div class="terminal__version">v1.0.0</div>
      </div>
    </header>

    <div class="terminal__body">

      <div class="terminal__log-init">
        <div class="terminal__log-line">
          <span class="terminal__prompt">$</span>
          <span class="terminal__log-text mono">aaf-to-als --init</span>
        </div>
        <div class="terminal__log-line">
          <span class="terminal__prompt ok">[OK]</span>
          <span class="terminal__log-text">System ready. Drop a <code class="inline-code">.aaf</code> file to begin.</span>
        </div>
      </div>

      <div class="terminal__divider">
        <span class="terminal__divider-label">INPUT</span>
      </div>

      <FileDropzone
        v-model:file="aafFile"
        :error="fileError"
        @error="fileError = $event"
      />

      <div class="terminal__run">
        <button
          class="terminal__run-btn"
          :disabled="!aafFile || !!fileError || conversionStatus === 'converting'"
          @click="startConversion"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Run Conversion
        </button>
        <p v-if="!aafFile || fileError" class="terminal__run-hint">Load an AAF file above to enable conversion</p>
      </div>

      <template v-if="conversionStatus !== 'idle'">
        <div class="terminal__divider">
          <span class="terminal__divider-label">EXECUTE</span>
        </div>
        <DownloadPanel
          :status="conversionStatus"
          :progress="conversionProgress"
          :stats="conversionStats"
          :error-message="conversionError"
          @download="downloadResult"
          @reset="resetConversion"
        />
      </template>

      <template v-if="parsedTimeline">
        <div class="terminal__divider">
          <span class="terminal__divider-label">OUTPUT</span>
        </div>
        <TrackPreview :timeline="parsedTimeline" :stats="conversionStats" />
      </template>

    </div>

    <footer class="terminal__footer">
      <span class="mono">process exited <span class="terminal__footer-ok">0</span></span>
      <span class="terminal__footer-sep">//</span>
      <span>Vue 3 · cfb · pako · JSZip</span>
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
  /* Halloween — grey + orange */
  --bg:           #1a1a1a;
  --bg-panel:     #232323;
  --bg-elevated:  #1e1e1e;
  --bg-deep:      #141414;
  --selection:    #2a2a2a;

  --border:       #2e2e2e;
  --border-mid:   #3a3a3a;
  --border-bright:#555555;

  --green:        #ff6b00;   /* pumpkin orange — primary/ok */
  --green-dim:    rgba(255, 107, 0, 0.1);
  --green-glow:   rgba(255, 107, 0, 0.25);

  --yellow:       #ff8c42;   /* warm orange — active/progress */
  --yellow-dim:   rgba(255, 140, 66, 0.12);

  --cyan:         #ffb347;   /* amber — secondary highlights */
  --cyan-dim:     rgba(255, 179, 71, 0.1);

  --blue-bright:  #cc9966;
  --blue:         #996633;

  --red:          #ff3b48;
  --red-dim:      rgba(255, 59, 72, 0.12);

  --orange:       #ff6b00;
  --magenta:      #cc6699;

  --text:         #c8c8c8;   /* light grey */
  --text-dim:     #787878;   /* mid grey */
  --text-muted:   #484848;   /* dark grey */
  --text-bright:  #f5f5f5;

  --font:         'Inter', system-ui, sans-serif;
  --mono:         'JetBrains Mono', 'Fira Code', monospace;
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
  padding: 0.05em 0.35em;
  color: var(--cyan);
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg-deep); }
::-webkit-scrollbar-thumb { background: var(--border-bright); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }
</style>

<style scoped>
.terminal {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  max-width: 880px;
  margin: 0 auto;
}

/* ── HEADER ── */
.terminal__header {
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--bg-elevated);
  z-index: 100;
}

.terminal__header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1.75rem;
}

.terminal__brand {
  display: flex;
  align-items: baseline;
  font-size: 1rem;
  font-weight: 700;
  font-family: var(--mono);
  letter-spacing: -0.02em;
}

.terminal__brand-prefix { color: var(--text-dim); }
.terminal__brand-name   { color: var(--text-bright); }

.terminal__header-center {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.terminal__tag {
  color: var(--text-dim);
  border: 1px solid var(--border-mid);
  padding: 0.2rem 0.6rem;
  border-radius: 2px;
}

.terminal__tag--green {
  color: var(--green);
  border-color: rgba(255, 107, 0, 0.35);
  background: rgba(255, 107, 0, 0.06);
}

.terminal__arrow {
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 300;
}

.terminal__version {
  font-size: 0.7rem;
  font-family: var(--mono);
  color: var(--text-muted);
  background: var(--bg-deep);
  border: 1px solid var(--border);
  padding: 0.2rem 0.5rem;
}

/* ── BODY ── */
.terminal__body {
  flex: 1;
  padding: 2rem 1.75rem;
  display: flex;
  flex-direction: column;
}

/* ── INIT LOG ── */
.terminal__log-init {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 1.75rem;
}

.terminal__log-line {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  font-size: 0.85rem;
}

.terminal__prompt {
  font-family: var(--mono);
  font-weight: 700;
  color: var(--text-muted);
  flex-shrink: 0;
  font-size: 0.75rem;
  min-width: 1.5rem;
}
.terminal__prompt.ok { color: var(--green); }

.terminal__log-text { color: var(--text); }

/* ── DIVIDERS ── */
.terminal__divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.75rem 0 1.1rem;
}

.terminal__divider::before,
.terminal__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.terminal__divider-label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--text-muted);
  flex-shrink: 0;
}

/* ── RUN BUTTON ── */
.terminal__run {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 1.1rem;
}

.terminal__run-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: none;
  border: 1px solid var(--border-bright);
  color: var(--text-bright);
  font-family: var(--font);
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.7rem 1.75rem;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s, box-shadow 0.15s;
  letter-spacing: 0.01em;
  border-radius: 2px;
}

.terminal__run-btn:not(:disabled):hover {
  border-color: var(--green);
  color: var(--green);
  background: var(--green-dim);
  box-shadow: 0 0 20px var(--green-glow);
}

.terminal__run-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.terminal__run-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-left: 0.1rem;
}

/* ── FOOTER ── */
.terminal__footer {
  border-top: 1px solid var(--border);
  padding: 0.8rem 1.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.terminal__footer-sep { color: var(--border-mid); }
.terminal__footer-ok  { color: var(--green); font-family: var(--mono); }
</style>
