<template>
  <div class="panel">

    <!-- CONVERTING -->
    <template v-if="status === 'converting'">
      <div class="panel__steps">
        <TransitionGroup name="step-fade">
          <div
            v-for="step in visibleSteps"
            :key="step.msg"
            class="panel__step panel__step--done"
          >
            <div class="panel__step-icon panel__step-icon--done">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span class="panel__step-msg">{{ step.msg }}</span>
          </div>
        </TransitionGroup>
        <div class="panel__step panel__step--active">
          <div class="panel__step-icon panel__step-icon--active">
            <span class="panel__spinner"></span>
          </div>
          <span class="panel__step-msg panel__step-msg--active">{{ currentStep.msg }}</span>
        </div>
      </div>
      <div class="panel__progress">
        <div class="panel__progress-track">
          <div class="panel__progress-fill" :style="{ width: (progress * 100) + '%' }"></div>
        </div>
        <span class="panel__progress-pct">{{ Math.round(progress * 100) }}%</span>
      </div>
    </template>

    <!-- DONE -->
    <template v-else-if="status === 'done'">
      <div class="panel__result">
        <div class="panel__result-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="panel__result-info">
          <p class="panel__result-title">Conversion complete</p>
          <p v-if="stats" class="panel__result-meta">
            {{ stats.trackCount }} tracks · {{ stats.clipCount }} clips · {{ stats.wavCount }} wav files
            <span class="panel__als-name">· {{ stats.alsName }}</span>
          </p>
        </div>
      </div>
      <div v-if="stats && stats.wavCount === 0" class="panel__notice">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        No embedded audio — place WAV files in <code class="inline-code">Samples/imported/</code> next to the .als file
      </div>
      <div class="panel__actions">
        <button class="panel__btn panel__btn--primary" @click="$emit('download')">
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
      <div class="panel__error">
        <div class="panel__error-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div>
          <p class="panel__error-title">Conversion failed</p>
          <p class="panel__error-msg">{{ errorMessage }}</p>
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
  { at: 0.00, msg: 'Parsing AAF container structure' },
  { at: 0.10, msg: 'CFB filesystem mounted' },
  { at: 0.25, msg: 'Building essence map' },
  { at: 0.40, msg: 'Master mob resolved, tracks mapped' },
  { at: 0.50, msg: 'Generating Ableton Live XML' },
  { at: 0.60, msg: 'ALS structure validated' },
  { at: 0.70, msg: 'Compressing with gzip' },
  { at: 0.80, msg: 'Packaging ZIP archive' },
  { at: 0.90, msg: 'Packaging complete' },
]

const visibleSteps = computed(() =>
  STEPS.filter(s => props.progress > s.at + 0.08)
)

const currentStep = computed(() =>
  [...STEPS].reverse().find(s => props.progress >= s.at) || STEPS[0]
)
</script>

<style scoped>
.panel {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── STEPS ── */
.panel__steps {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.panel__step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.82rem;
}

.panel__step-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.panel__step-icon--done {
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  color: var(--accent);
}

.panel__step-icon--active {
  background: var(--warm-dim);
  border: 1px solid rgba(255, 140, 66, 0.3);
}

.panel__step--done .panel__step-msg {
  color: var(--text-dim);
}

.panel__step-msg--active {
  color: var(--text-bright);
  font-weight: 500;
}

.panel__spinner {
  width: 8px;
  height: 8px;
  border: 1.5px solid rgba(255, 140, 66, 0.3);
  border-top-color: var(--warm);
  border-radius: 50%;
  display: block;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── PROGRESS ── */
.panel__progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.panel__progress-track {
  flex: 1;
  height: 4px;
  background: var(--bg-elevated);
  border-radius: 10px;
  overflow: hidden;
}

.panel__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--warm));
  border-radius: 10px;
  transition: width 0.3s ease;
  box-shadow: 0 0 8px var(--accent-glow);
}

.panel__progress-pct {
  font-size: 0.72rem;
  font-family: var(--mono);
  color: var(--text-dim);
  flex-shrink: 0;
  min-width: 2.5rem;
  text-align: right;
}

/* ── DONE ── */
.panel__result {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.25rem 0;
}

.panel__result-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
}

.panel__result-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-bright);
  margin-bottom: 0.2rem;
}

.panel__result-meta {
  font-size: 0.78rem;
  color: var(--text-dim);
  font-family: var(--mono);
}

.panel__als-name {
  color: var(--amber);
}

/* ── NOTICE ── */
.panel__notice {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--warm-dim);
  border: 1px solid rgba(255, 140, 66, 0.2);
  border-radius: var(--radius-sm);
  padding: 0.7rem 0.9rem;
  font-size: 0.79rem;
  color: var(--warm);
}

/* ── ERROR ── */
.panel__error {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.25rem 0;
}

.panel__error-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: var(--red-dim);
  border: 1px solid rgba(240, 62, 62, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--red);
  flex-shrink: 0;
}

.panel__error-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-bright);
  margin-bottom: 0.25rem;
}

.panel__error-msg {
  font-size: 0.8rem;
  color: var(--red);
}

/* ── ACTIONS ── */
.panel__actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
}

.panel__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.55rem 1.2rem;
  cursor: pointer;
  transition: all 0.15s;
  border-radius: var(--radius-sm);
  letter-spacing: -0.01em;
}

.panel__btn--primary {
  background: var(--accent);
  border: none;
  color: #fff;
}

.panel__btn--primary:hover {
  background: color-mix(in srgb, var(--accent) 85%, white 15%);
  box-shadow: 0 0 16px var(--accent-glow);
}

.panel__btn--ghost {
  background: none;
  border: 1px solid var(--border-mid);
  color: var(--text-dim);
}

.panel__btn--ghost:hover {
  border-color: var(--border-bright);
  color: var(--text);
  background: rgba(255,255,255,0.03);
}

/* ── TRANSITIONS ── */
.step-fade-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.step-fade-enter-from   { opacity: 0; transform: translateY(4px); }
</style>
