<template>
  <div class="preview" v-if="timeline">
    <div class="preview__header">
      <h3 class="preview__title">Timeline Preview</h3>
      <span class="preview__name">{{ timeline.name }}</span>
    </div>

    <div class="preview__meta">
      <div class="preview__meta-item">
        <span class="preview__meta-label">Edit Rate</span>
        <span class="preview__meta-value">{{ formatEditRate(timeline.editRate) }}</span>
      </div>
      <div class="preview__meta-item">
        <span class="preview__meta-label">Tracks</span>
        <span class="preview__meta-value">{{ timeline.tracks.length }}</span>
      </div>
      <div class="preview__meta-item">
        <span class="preview__meta-label">Total Clips</span>
        <span class="preview__meta-value">{{ totalClips }}</span>
      </div>
      <div class="preview__meta-item">
        <span class="preview__meta-label">Duration</span>
        <span class="preview__meta-value">{{ formatDuration(timeline) }}</span>
      </div>
    </div>

    <div class="preview__tracks" v-if="timeline.tracks.length > 0">
      <div
        v-for="(track, i) in timeline.tracks"
        :key="i"
        class="preview__track"
      >
        <div class="preview__track-header">
          <div class="preview__track-info">
            <span class="preview__track-badge" :class="track.isAudio ? 'badge--audio' : 'badge--other'">
              {{ track.isAudio ? 'Audio' : 'Other' }}
            </span>
            <span class="preview__track-name">{{ track.name || `Track ${i + 1}` }}</span>
            <span class="preview__track-rate">{{ formatEditRate(track.editRate) }}</span>
          </div>
          <span class="preview__clip-count">{{ track.clips ? track.clips.length : 0 }} clips</span>
        </div>

        <div class="preview__clips" v-if="track.clips && track.clips.length > 0">
          <div
            v-for="(clip, j) in track.clips.slice(0, 5)"
            :key="j"
            class="preview__clip"
          >
            <span class="preview__clip-name">{{ clip.trackName || getFileName(clip.filePath) || `Clip ${j + 1}` }}</span>
            <div class="preview__clip-details">
              <span class="preview__clip-time">@ {{ formatTime(clip.startTime, track.editRate) }}</span>
              <span class="preview__clip-dur">{{ formatTime(clip.length, track.editRate) }}</span>
            </div>
            <span
              v-if="clip.filePath"
              class="preview__clip-path"
              :title="clip.filePath"
            >{{ truncatePath(clip.filePath) }}</span>
            <span v-else class="preview__clip-no-path">No file path</span>
          </div>
          <div v-if="track.clips.length > 5" class="preview__clips-more">
            +{{ track.clips.length - 5 }} more clips...
          </div>
        </div>
        <div v-else class="preview__no-clips">No clips in this track</div>
      </div>
    </div>

    <div v-if="timeline.warnings && timeline.warnings.length > 0" class="preview__warnings">
      <div class="preview__warnings-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Parser Warnings
      </div>
      <ul class="preview__warnings-list">
        <li v-for="(w, i) in timeline.warnings" :key="i">{{ w }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  timeline: {
    type: Object,
    default: null
  }
})

const totalClips = computed(() => {
  if (!props.timeline) return 0
  return props.timeline.tracks.reduce((sum, t) => sum + (t.clips ? t.clips.length : 0), 0)
})

function formatEditRate(editRate) {
  if (!editRate) return '—'
  const { numerator, denominator } = editRate
  if (!denominator) return `${numerator}`
  const rate = numerator / denominator
  if (rate === Math.floor(rate)) return `${rate}`
  return `${rate.toFixed(2)}`
}

function formatDuration(timeline) {
  if (!timeline || !timeline.tracks || timeline.tracks.length === 0) return '—'
  let maxEU = 0
  let editRate = timeline.editRate || { numerator: 48000, denominator: 1 }
  for (const track of timeline.tracks) {
    const er = track.editRate || editRate
    const euPerSec = er.numerator / (er.denominator || 1)
    for (const clip of (track.clips || [])) {
      const endEU = clip.startTime + clip.length
      // Normalize to timeline edit rate
      const endSec = endEU / euPerSec
      const erRate = editRate.numerator / (editRate.denominator || 1)
      const normalizedEU = endSec * erRate
      if (normalizedEU > maxEU) maxEU = normalizedEU
    }
  }
  const euPerSec = editRate.numerator / (editRate.denominator || 1)
  if (euPerSec === 0) return '—'
  const seconds = maxEU / euPerSec
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatTime(editUnits, editRate) {
  if (!editRate || !editRate.numerator) return `${editUnits}`
  const euPerSec = editRate.numerator / (editRate.denominator || 1)
  const seconds = editUnits / euPerSec
  if (seconds < 60) return `${seconds.toFixed(2)}s`
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(2)
  return `${m}:${s.padStart(5, '0')}s`
}

function getFileName(filePath) {
  if (!filePath) return null
  return filePath.replace(/\\/g, '/').split('/').pop()
}

function truncatePath(filePath) {
  if (!filePath) return ''
  const maxLen = 50
  if (filePath.length <= maxLen) return filePath
  const parts = filePath.replace(/\\/g, '/').split('/')
  const fileName = parts.pop()
  return '.../' + fileName
}
</script>

<style scoped>
.preview {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.preview__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
  font-family: var(--font-mono);
}

.preview__name {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--accent-blue);
  background: var(--bg-primary);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.preview__meta {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border-color);
}

.preview__meta-item {
  flex: 1;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  border-right: 1px solid var(--border-color);
}

.preview__meta-item:last-child {
  border-right: none;
}

.preview__meta-label {
  font-size: 0.7rem;
  color: var(--text-disabled);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: var(--font-mono);
}

.preview__meta-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.preview__tracks {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.preview__track {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.preview__track-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.8rem;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-color);
}

.preview__track-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview__track-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-family: var(--font-mono);
}

.badge--audio {
  background: rgba(106, 171, 115, 0.15);
  color: var(--accent-green);
  border: 1px solid rgba(106, 171, 115, 0.3);
}

.badge--other {
  background: rgba(79, 140, 201, 0.15);
  color: var(--accent-blue);
  border: 1px solid rgba(79, 140, 201, 0.3);
}

.preview__track-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.preview__track-rate {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.preview__clip-count {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.preview__clips {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.preview__clip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  background: var(--bg-secondary);
  font-size: 0.78rem;
}

.preview__clip-name {
  font-family: var(--font-mono);
  color: var(--text-primary);
  font-weight: 500;
  min-width: 100px;
  flex: 1;
}

.preview__clip-details {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.preview__clip-time,
.preview__clip-dur {
  font-family: var(--font-mono);
  color: var(--text-secondary);
  font-size: 0.72rem;
}

.preview__clip-path {
  font-family: var(--font-mono);
  color: var(--accent-blue);
  font-size: 0.7rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.preview__clip-no-path {
  font-family: var(--font-mono);
  color: var(--text-disabled);
  font-size: 0.7rem;
  font-style: italic;
}

.preview__clips-more {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  padding: 0.2rem 0.5rem;
  font-style: italic;
}

.preview__no-clips {
  padding: 0.5rem;
  font-size: 0.78rem;
  color: var(--text-disabled);
  font-family: var(--font-mono);
  font-style: italic;
}

.preview__warnings {
  border-top: 1px solid var(--border-color);
  padding: 0.75rem 1rem;
  background: rgba(201, 119, 63, 0.05);
}

.preview__warnings-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--accent-orange);
  font-family: var(--font-mono);
  margin-bottom: 0.5rem;
}

.preview__warnings-list {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.preview__warnings-list li {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}
</style>
