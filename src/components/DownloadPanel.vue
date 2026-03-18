<template>
  <div class="panel">

    <!-- CONVERTING -->
    <template v-if="status === 'converting'">
      <div class="panel__log">
        <TransitionGroup name="log-fade">
          <div
            v-for="line in visibleLogLines"
            :key="line.msg"
            class="panel__log-entry"
            :class="'entry--' + line.type"
          >
            <span class="panel__log-tag">{{ line.tag }}</span>
            <span class="panel__log-msg">{{ line.msg }}</span>
          </div>
        </TransitionGroup>
        <div class="panel__log-entry entry--active">
          <span class="panel__log-tag tag--active">···</span>
          <span class="panel__log-msg">{{ currentStep.msg }}<span class="panel__cursor">▌</span></span>
        </div>
        <div class="panel__progress">
          <div class="panel__progress-track">
            <div class="panel__progress-fill" :style="{ width: (progress * 100) + '%' }"></div>
          </div>
          <span class="panel__progress-pct mono">{{ Math.round(progress * 100) }}%</span>
        </div>
      </div>
    </template>

    <!-- DONE -->
    <template v-else-if="status === 'done'">
      <div class="panel__log">
        <div class="panel__log-entry entry--ok">
          <span class="panel__log-tag">OK</span>
          <span class="panel__log-msg">Conversion complete</span>
        </div>
        <div v-if="stats" class="panel__log-entry entry--meta">
          <span class="panel__log-tag">→</span>
          <span class="panel__log-msg">
            <span class="mono">{{ stats.trackCount }}</span> tracks ·
            <span class="mono">{{ stats.clipCount }}</span> clips ·
            <span class="mono">{{ stats.wavCount }}</span> wav files ·
            <span class="panel__als-name mono">{{ stats.alsName }}</span>
          </span>
        </div>
        <div v-if="stats && stats.wavCount === 0" class="panel__log-entry entry--warn">
          <span class="panel__log-tag">!</span>
          <span class="panel__log-msg">No embedded audio — place your WAV files in <span class="mono">Samples/imported/</span> next to the .als file</span>
        </div>
      </div>
      <div class="panel__actions">
        <button class="panel__btn panel__btn--green" @click="$emit('download')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download ZIP
        </button>
        <button class="panel__btn panel__btn--ghost" @click="$emit('reset')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Convert Another
        </button>
      </div>
    </template>

    <!-- ERROR -->
    <template v-else-if="status === 'error'">
      <div class="panel__log">
        <div class="panel__log-entry entry--err">
          <span class="panel__log-tag">ERR</span>
          <span class="panel__log-msg">{{ errorMessage }}</span>
        </div>
      </div>
      <div class="panel__actions">
        <button class="panel__btn panel__btn--ghost" @click="$emit('reset')">Try Again</button>
      </div>
    </template>

  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status:       { type: String,  default: 'idle' },
  progress:     { type: Number,  default: 0 },
  stats:        { type: Object,  default: null },
  errorMessage: { type: String,  default: '' },
})

defineEmits(['download', 'reset'])

const STEPS = [
  { at: 0.00, tag: '$',  msg: 'Parsing AAF container structure',   type: 'cmd' },
  { at: 0.10, tag: 'OK', msg: 'CFB filesystem mounted',            type: 'ok'  },
  { at: 0.25, tag: '$',  msg: 'Building essence map',              type: 'cmd' },
  { at: 0.40, tag: 'OK', msg: 'Master mob resolved, tracks mapped', type: 'ok' },
  { at: 0.50, tag: '$',  msg: 'Generating Ableton Live XML',       type: 'cmd' },
  { at: 0.60, tag: 'OK', msg: 'ALS structure validated',           type: 'ok'  },
  { at: 0.70, tag: '$',  msg: 'Compressing with gzip',             type: 'cmd' },
  { at: 0.80, tag: '$',  msg: 'Packaging ZIP archive',             type: 'cmd' },
  { at: 0.90, tag: 'OK', msg: 'Packaging complete',                 type: 'ok'  },
]

const visibleLogLines = computed(() =>
  STEPS.filter(s => props.progress > s.at + 0.08)
)

const currentStep = computed(() =>
  [...STEPS].reverse().find(s => props.progress >= s.at) || STEPS[0]
)
</script>

<style scoped>
.panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-mid);
  padding: 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

/* ── LOG ── */
.panel__log {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.panel__log-entry {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  font-size: 0.83rem;
  line-height: 1.65;
}

.panel__log-tag {
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
  min-width: 2.2rem;
  color: var(--text-muted);
  letter-spacing: 0.03em;
}

.panel__log-msg {
  color: var(--text);
}

/* entry variants */
.entry--ok   .panel__log-tag { color: var(--green); }
.entry--err  .panel__log-tag { color: var(--red); }
.entry--err  .panel__log-msg { color: var(--red); }
.entry--meta .panel__log-tag { color: var(--text-dim); }
.entry--meta .panel__log-msg { color: var(--text-dim); font-size: 0.78rem; }
.entry--warn .panel__log-tag { color: var(--yellow); }
.entry--warn .panel__log-msg { color: var(--yellow); font-size: 0.78rem; }
.entry--active .panel__log-msg { color: var(--yellow); }

.tag--active {
  color: var(--yellow) !important;
  animation: pulse-tag 1.4s ease-in-out infinite;
}

@keyframes pulse-tag {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.panel__cursor {
  color: var(--yellow);
  animation: blink 0.9s step-end infinite;
  margin-left: 1px;
  font-family: var(--mono);
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.panel__als-name { color: var(--cyan); }

/* ── PROGRESS BAR ── */
.panel__progress {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-top: 0.4rem;
}

.panel__progress-track {
  flex: 1;
  height: 3px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  overflow: hidden;
}

.panel__progress-fill {
  height: 100%;
  background: var(--green);
  transition: width 0.3s ease;
  box-shadow: 0 0 8px var(--green-glow);
}

.panel__progress-pct {
  font-size: 0.7rem;
  color: var(--text-dim);
  flex-shrink: 0;
  min-width: 2.5rem;
  text-align: right;
}

/* ── ACTIONS ── */
.panel__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
}

.panel__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  font-family: var(--font);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.6rem 1.3rem;
  cursor: pointer;
  transition: all 0.15s;
  border-radius: 2px;
  letter-spacing: 0.01em;
}

.panel__btn--green {
  border: 1px solid var(--green);
  color: var(--green);
}

.panel__btn--green:hover {
  background: var(--green-dim);
  box-shadow: 0 0 16px var(--green-glow);
}

.panel__btn--ghost {
  border: 1px solid var(--border-mid);
  color: var(--text-dim);
}

.panel__btn--ghost:hover {
  border-color: var(--border-bright);
  color: var(--text);
  background: rgba(255,255,255,0.03);
}

/* ── TRANSITIONS ── */
.log-fade-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.log-fade-enter-from   { opacity: 0; transform: translateY(4px); }
</style>
