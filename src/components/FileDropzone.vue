<template>
  <div
    class="drop"
    :class="{
      'drop--active': isDragging,
      'drop--loaded': !!file,
      'drop--error':  !!error,
    }"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
    @click="!file && fileInputRef?.click()"
  >
    <input
      ref="fileInputRef"
      type="file"
      accept=".aaf"
      style="display:none"
      @change="e => validateAndEmit(e.target.files?.[0])"
    />

    <!-- Empty state -->
    <template v-if="!file">
      <div class="drop__inner">
        <div class="drop__icon-area">
          <div class="drop__icon" :class="{ 'drop__icon--active': isDragging }">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
        </div>
        <div class="drop__text-area">
          <p class="drop__primary" v-if="!isDragging">
            Drop your <span class="drop__highlight">.aaf</span> file here
          </p>
          <p class="drop__primary drop__primary--active" v-else>
            Release to load file
          </p>
          <p class="drop__secondary">or <span class="drop__link">click to browse</span> your filesystem</p>
        </div>
        <div class="drop__hint">
          <span class="drop__hint-label">Supports:</span>
          AAF exports from DaVinci Resolve
        </div>
      </div>
    </template>

    <!-- File loaded -->
    <template v-else>
      <div class="drop__file">
        <div class="drop__file-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <polyline points="9 13 11 15 15 11"/>
          </svg>
        </div>
        <div class="drop__file-info">
          <span class="drop__file-name">{{ file.name }}</span>
          <span class="drop__file-meta">{{ formatSize(file.size) }} · AAF</span>
        </div>
        <button class="drop__clear" @click.stop="clearFile">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </template>

    <!-- Error -->
    <div v-if="error" class="drop__error">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  file:  { type: Object, default: null },
  error: { type: String, default: '' },
})
const emit = defineEmits(['update:file', 'error'])

const fileInputRef = ref(null)
const isDragging   = ref(false)

function onDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) isDragging.value = false
}

function onDrop(e) {
  isDragging.value = false
  validateAndEmit(e.dataTransfer?.files?.[0])
}

function validateAndEmit(f) {
  if (!f) return
  if (!f.name.toLowerCase().endsWith('.aaf')) {
    emit('error', 'Invalid file type — only .aaf files are supported')
    return
  }
  emit('error', '')
  emit('update:file', f)
}

function clearFile() {
  emit('update:file', null)
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function formatSize(b) {
  if (b < 1024) return b + ' B'
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1048576).toFixed(2) + ' MB'
}
</script>

<style scoped>
.drop {
  border: 1px solid var(--border-mid);
  background: var(--bg-panel);
  padding: 2rem 1.75rem;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  position: relative;
  min-height: 130px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.drop:hover:not(.drop--loaded) {
  border-color: var(--border-bright);
  background: color-mix(in srgb, var(--bg-panel) 92%, var(--cyan) 8%);
}

.drop--active {
  border-color: var(--green) !important;
  background: color-mix(in srgb, var(--bg-panel) 90%, var(--green) 10%) !important;
  box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.08), inset 0 0 60px rgba(255, 107, 0, 0.03);
}

.drop--loaded {
  border-color: var(--border-mid);
  background: var(--bg-elevated);
  cursor: default;
  min-height: 80px;
}

.drop--error {
  border-color: var(--red) !important;
  background: var(--red-dim) !important;
}

/* ── EMPTY STATE ── */
.drop__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  text-align: center;
}

.drop__icon {
  color: var(--text-muted);
  transition: color 0.18s, transform 0.18s;
}

.drop__icon--active {
  color: var(--green);
  transform: translateY(-3px);
}

.drop:hover:not(.drop--loaded) .drop__icon {
  color: var(--cyan);
}

.drop__primary {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-bright);
  margin-bottom: 0.2rem;
}

.drop__primary--active {
  color: var(--green);
}

.drop__highlight {
  font-family: var(--mono);
  color: var(--cyan);
  font-size: 0.9em;
}

.drop__secondary {
  font-size: 0.82rem;
  color: var(--text-dim);
}

.drop__link {
  color: var(--cyan);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: rgba(0, 250, 252, 0.35);
}

.drop__hint {
  font-size: 0.72rem;
  color: var(--text-muted);
  border: 1px solid var(--border);
  padding: 0.25rem 0.7rem;
  background: var(--bg-elevated);
}

.drop__hint-label {
  color: var(--text-dim);
  font-weight: 500;
  margin-right: 0.2rem;
}

/* ── LOADED STATE ── */
.drop__file {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.drop__file-icon {
  color: var(--green);
  flex-shrink: 0;
}

.drop__file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.drop__file-name {
  font-family: var(--mono);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-bright);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drop__file-meta {
  font-size: 0.72rem;
  color: var(--text-dim);
  font-family: var(--mono);
}

.drop__clear {
  background: none;
  border: 1px solid var(--border-mid);
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.3rem 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.15s, border-color 0.15s;
  border-radius: 2px;
}

.drop__clear:hover {
  color: var(--red);
  border-color: var(--red);
  background: var(--red-dim);
}

/* ── ERROR ── */
.drop__error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 59, 72, 0.2);
  font-size: 0.8rem;
  color: var(--red);
}
</style>
