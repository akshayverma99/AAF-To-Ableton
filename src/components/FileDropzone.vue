<template>
  <div
    class="dropzone"
    :class="{
      'dropzone--active': isDragging,
      'dropzone--has-file': !!file,
      'dropzone--error': !!error
    }"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
    @click="triggerFileInput"
  >
    <input
      ref="fileInputRef"
      type="file"
      accept=".aaf"
      style="display: none"
      @change="onFileInputChange"
    />

    <div v-if="!file" class="dropzone__content">
      <div class="dropzone__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
      </div>
      <div class="dropzone__text">
        <p class="dropzone__primary">Drop your AAF file here</p>
        <p class="dropzone__secondary">or click to browse</p>
      </div>
      <div class="dropzone__hint">Supports AAF files exported from DaVinci Resolve</div>
    </div>

    <div v-else class="dropzone__file">
      <div class="dropzone__file-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
      </div>
      <div class="dropzone__file-info">
        <span class="dropzone__file-name">{{ file.name }}</span>
        <span class="dropzone__file-size">{{ formatFileSize(file.size) }}</span>
      </div>
      <button class="dropzone__clear" @click.stop="clearFile" title="Remove file">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div v-if="error" class="dropzone__error-msg">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  file: {
    type: Object,
    default: null
  },
  error: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:file', 'error'])

const fileInputRef = ref(null)
const isDragging = ref(false)

function triggerFileInput() {
  if (!props.file) {
    fileInputRef.value?.click()
  }
}

function onDragOver(e) {
  isDragging.value = true
}

function onDragLeave(e) {
  // Only set to false if we're actually leaving the dropzone
  if (!e.currentTarget.contains(e.relatedTarget)) {
    isDragging.value = false
  }
}

function onDrop(e) {
  isDragging.value = false
  const droppedFile = e.dataTransfer?.files?.[0]
  if (droppedFile) {
    validateAndEmit(droppedFile)
  }
}

function onFileInputChange(e) {
  const selectedFile = e.target.files?.[0]
  if (selectedFile) {
    validateAndEmit(selectedFile)
  }
}

function validateAndEmit(f) {
  if (!f.name.toLowerCase().endsWith('.aaf')) {
    emit('error', 'Please select an AAF file (.aaf extension required)')
    return
  }
  emit('error', '')
  emit('update:file', f)
}

function clearFile() {
  emit('update:file', null)
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}
</script>

<style scoped>
.dropzone {
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 2rem;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
  background: var(--bg-secondary);
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.dropzone:hover {
  border-color: var(--accent-blue);
  background: var(--bg-elevated);
}

.dropzone--active {
  border-color: var(--accent-blue);
  background: var(--bg-elevated);
  border-style: solid;
}

.dropzone--has-file {
  cursor: default;
  border-style: solid;
  border-color: var(--accent-green);
}

.dropzone--error {
  border-color: var(--accent-red);
}

.dropzone__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-secondary);
}

.dropzone__icon {
  color: var(--accent-blue);
  opacity: 0.7;
}

.dropzone__text {
  text-align: center;
}

.dropzone__primary {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.dropzone__secondary {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0;
}

.dropzone__hint {
  font-size: 0.75rem;
  color: var(--text-disabled);
  font-family: var(--font-mono);
}

.dropzone__file {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 500px;
}

.dropzone__file-icon {
  color: var(--accent-green);
  flex-shrink: 0;
}

.dropzone__file-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.dropzone__file-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-mono);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropzone__file-size {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.dropzone__clear {
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, border-color 0.2s;
  flex-shrink: 0;
}

.dropzone__clear:hover {
  color: var(--accent-red);
  border-color: var(--accent-red);
}

.dropzone__error-msg {
  color: var(--accent-red);
  font-size: 0.8rem;
  margin-top: 0.75rem;
  font-family: var(--font-mono);
}
</style>
