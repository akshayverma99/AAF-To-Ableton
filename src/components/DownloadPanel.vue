<template>
  <div class="download">
    <!-- Initial / ready state -->
    <div v-if="status === 'idle'" class="download__idle">
      <button
        class="download__btn download__btn--primary"
        :disabled="!canConvert"
        @click="$emit('convert')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        Convert to .als + WAV (ZIP)
      </button>
      <p v-if="!canConvert" class="download__hint">Load an AAF file to begin</p>
    </div>

    <!-- Converting state -->
    <div v-else-if="status === 'converting'" class="download__converting">
      <div class="download__progress">
        <div class="download__progress-bar" :style="{ width: (progress * 100) + '%' }"></div>
      </div>
      <div class="download__progress-text">
        <span class="download__spinner"></span>
        Converting... {{ Math.round(progress * 100) }}%
      </div>
    </div>

    <!-- Success state -->
    <div v-else-if="status === 'done'" class="download__success">
      <div class="download__success-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div class="download__success-text">
        <div class="download__success-title">Conversion successful!</div>
        <div class="download__success-stats" v-if="stats">
          {{ stats.trackCount }} tracks · {{ stats.clipCount }} clips
        </div>
      </div>
      <div class="download__actions">
        <button class="download__btn download__btn--success" @click="$emit('download')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download ZIP
        </button>
        <button class="download__btn download__btn--secondary" @click="$emit('reset')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Convert Another
        </button>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="status === 'error'" class="download__error">
      <div class="download__error-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <div class="download__error-content">
        <div class="download__error-title">Conversion failed</div>
        <div class="download__error-message">{{ errorMessage }}</div>
      </div>
      <button class="download__btn download__btn--secondary" @click="$emit('reset')">Try Again</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  status: {
    type: String,
    default: 'idle', // 'idle' | 'converting' | 'done' | 'error'
  },
  progress: {
    type: Number,
    default: 0,
  },
  canConvert: {
    type: Boolean,
    default: false,
  },
  stats: {
    type: Object,
    default: null,
  },
  errorMessage: {
    type: String,
    default: '',
  },
})

defineEmits(['convert', 'download', 'reset'])
</script>

<style scoped>
.download {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
}

.download__idle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.download__btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.download__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.download__btn--primary {
  background: var(--accent-blue);
  color: #fff;
  padding: 0.75rem 2rem;
  font-size: 1rem;
}

.download__btn--primary:not(:disabled):hover {
  background: var(--accent-blue-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 140, 201, 0.3);
}

.download__btn--success {
  background: var(--accent-green);
  color: #fff;
}

.download__btn--success:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.download__btn--secondary {
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.download__btn--secondary:hover {
  color: var(--text-primary);
  border-color: var(--text-secondary);
}

.download__hint {
  font-size: 0.8rem;
  color: var(--text-disabled);
  font-family: var(--font-mono);
  margin: 0;
}

.download__converting {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.download__progress {
  width: 100%;
  height: 4px;
  background: var(--bg-elevated);
  border-radius: 2px;
  overflow: hidden;
}

.download__progress-bar {
  height: 100%;
  background: var(--accent-blue);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.download__progress-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.download__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.download__success {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.download__success-icon {
  color: var(--accent-green);
  background: rgba(106, 171, 115, 0.1);
  border: 1px solid rgba(106, 171, 115, 0.3);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.download__success-text {
  flex: 1;
}

.download__success-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent-green);
  font-family: var(--font-mono);
}

.download__success-stats {
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  margin-top: 0.2rem;
}

.download__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.download__error {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.download__error-icon {
  color: var(--accent-red);
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.download__error-content {
  flex: 1;
  min-width: 0;
}

.download__error-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent-red);
  font-family: var(--font-mono);
}

.download__error-message {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  margin-top: 0.25rem;
  word-break: break-word;
}
</style>
