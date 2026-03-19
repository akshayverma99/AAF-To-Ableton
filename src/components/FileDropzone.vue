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
        <div class="drop__icon-wrap" :class="{ 'drop__icon-wrap--active': isDragging }">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div class="drop__text">
          <p class="drop__primary" v-if="!isDragging">
            Drop your <code class="drop__ext">.aaf</code> file here
          </p>
          <p class="drop__primary drop__primary--active" v-else>Release to load</p>
          <p class="drop__secondary">or <span class="drop__link">click to browse</span></p>
        </div>
        <div class="drop__badge">AAF · DaVinci Resolve</div>
      </div>
    </template>

    <!-- File loaded -->
    <template v-else>
      <div class="drop__file">
        <div class="drop__file-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <polyline points="9 13 11 15 15 11"/>
          </svg>
        </div>
        <div class="drop__file-info">
          <span class="drop__file-name">{{ file.name }}</span>
          <span class="drop__file-meta">{{ formatSize(file.size) }} · AAF</span>
        </div>
        <button class="drop__clear" @click.stop="clearFile" title="Remove file">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </template>

    <!-- Error -->
    <div v-if="error" class="drop__error">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
  padding: 2.5rem 1.5rem;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  position: relative;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1.5px dashed var(--border-mid);
  border-radius: var(--radius);
  margin: 1.25rem;
}

.drop:hover:not(.drop--loaded) {
  border-color: var(--border-bright);
  background: rgba(255,255,255,0.015);
}

.drop--active {
  border-color: var(--accent) !important;
  border-style: solid !important;
  background: var(--accent-dim) !important;
}

.drop--loaded {
  border-style: solid;
  border-color: var(--border);
  background: var(--bg-elevated);
  cursor: default;
  min-height: 72px;
  padding: 1rem 1.25rem;
  margin: 1.25rem;
  border-radius: var(--radius-sm);
  align-items: stretch;
}

.drop--error {
  border-color: var(--red) !important;
  border-style: solid !important;
  background: var(--red-dim) !important;
}

/* ── EMPTY STATE ── */
.drop__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.drop__icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-mid);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
  transition: color 0.2s, border-color 0.2s, transform 0.2s;
}

.drop:hover:not(.drop--loaded) .drop__icon-wrap {
  color: var(--text);
  border-color: var(--border-bright);
}

.drop__icon-wrap--active {
  color: var(--accent) !important;
  border-color: var(--accent-border) !important;
  background: var(--accent-dim) !important;
  transform: translateY(-2px);
}

.drop__text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.drop__primary {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-bright);
}

.drop__primary--active {
  color: var(--accent);
}

.drop__ext {
  font-family: var(--mono);
  font-size: 0.85em;
  background: var(--bg-elevated);
  border: 1px solid var(--border-mid);
  padding: 0.05em 0.4em;
  border-radius: 4px;
  color: var(--amber);
}

.drop__secondary {
  font-size: 0.8rem;
  color: var(--text-dim);
}

.drop__link {
  color: var(--accent);
  font-weight: 500;
}

.drop__badge {
  font-size: 0.68rem;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  padding: 0.25rem 0.7rem;
  border-radius: 20px;
  letter-spacing: 0.03em;
}

/* ── LOADED STATE ── */
.drop__file {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
}

.drop__file-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
}

.drop__file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.drop__file-name {
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
  width: 28px;
  height: 28px;
  background: none;
  border: 1px solid var(--border);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  border-radius: var(--radius-sm);
}

.drop__clear:hover {
  color: var(--red);
  border-color: rgba(240, 62, 62, 0.4);
  background: var(--red-dim);
}

/* ── ERROR ── */
.drop__error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  font-size: 0.78rem;
  color: var(--red);
}
</style>
