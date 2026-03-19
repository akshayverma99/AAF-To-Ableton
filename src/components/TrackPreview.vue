<template>
  <div class="tview" v-if="timeline">

    <!-- stats row -->
    <div class="tview__stats">
      <div class="tview__stat-item">
        <span class="tview__stat-value">{{ timeline.tracks.length }}</span>
        <span class="tview__stat-label">tracks</span>
      </div>
      <div class="tview__stat-divider"></div>
      <div class="tview__stat-item">
        <span class="tview__stat-value">{{ totalClips }}</span>
        <span class="tview__stat-label">clips</span>
      </div>
      <div class="tview__stat-divider"></div>
      <div class="tview__stat-item">
        <span class="tview__stat-value">{{ duration }}</span>
        <span class="tview__stat-label">duration</span>
      </div>
      <div class="tview__project-name">{{ timeline.name }}</div>
    </div>

    <!-- track list -->
    <div class="tview__tracks">
      <div
        v-for="(track, ti) in timeline.tracks"
        :key="ti"
        class="tview__track"
      >
        <div class="tview__track-header">
          <div class="tview__track-left">
            <span class="tview__track-tag">AUDIO</span>
            <span class="tview__track-name">{{ track.name || `Track ${ti + 1}` }}</span>
          </div>
          <span class="tview__track-count">{{ track.clips ? track.clips.length : 0 }} clips</span>
        </div>

        <div v-if="track.clips && track.clips.length" class="tview__clips">
          <div
            v-for="(clip, ci) in (track.clips || []).slice(0, 6)"
            :key="ci"
            class="tview__clip"
          >
            <span class="tview__clip-pos">{{ fmtTime(clip.positionBeats ?? clip.startTime / 48000) }}</span>
            <span class="tview__clip-dur">{{ fmtDur(clip.durationBeats ?? clip.length / 48000) }}</span>
            <span class="tview__clip-name">{{ clip.wavName ? clip.wavName.replace(/\.wav$/i, '') : (clip.trackName || `clip_${ci}`) }}</span>
          </div>
          <div v-if="(track.clips?.length || 0) > 6" class="tview__clip tview__clip--more">
            +{{ track.clips.length - 6 }} more clips
          </div>
        </div>
      </div>
    </div>

    <!-- warnings -->
    <div v-if="timeline.warnings?.length" class="tview__warnings">
      <div class="tview__warn" v-for="(w, i) in timeline.warnings" :key="i">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        {{ w }}
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  timeline: { type: Object, default: null },
  stats:    { type: Object, default: null },
})

const totalClips = computed(() =>
  (props.timeline?.tracks || []).reduce((s, t) => s + (t.clips?.length || 0), 0)
)

const duration = computed(() => {
  if (!props.timeline) return '—'
  let maxSec = 0
  for (const t of (props.timeline.tracks || [])) {
    for (const c of (t.clips || [])) {
      const end = (c.positionBeats ?? 0) + (c.durationBeats ?? 0)
      if (end > maxSec) maxSec = end
    }
  }
  if (!maxSec) return '—'
  const m = Math.floor(maxSec / 60)
  const s = Math.floor(maxSec % 60)
  return m + ':' + String(s).padStart(2, '0')
})

function fmtTime(sec) {
  if (sec == null) return '?'
  const m = Math.floor(sec / 60)
  const s = (sec % 60).toFixed(1)
  return m > 0 ? `${m}:${String(s).padStart(4,'0')}` : `${Number(sec.toFixed(1))}s`
}

function fmtDur(sec) {
  if (sec == null) return ''
  return `${sec.toFixed(2)}s`
}
</script>

<style scoped>
.tview {
  display: flex;
  flex-direction: column;
}

/* ── STATS ── */
.tview__stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid var(--border);
}

.tview__stat-item {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.tview__stat-value {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-bright);
  font-family: var(--mono);
}

.tview__stat-label {
  font-size: 0.72rem;
  color: var(--text-dim);
}

.tview__stat-divider {
  width: 1px;
  height: 14px;
  background: var(--border-mid);
}

.tview__project-name {
  margin-left: auto;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent);
  font-family: var(--mono);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── TRACKS ── */
.tview__tracks {
  display: flex;
  flex-direction: column;
  max-height: 420px;
  overflow-y: auto;
}

.tview__track {
  border-bottom: 1px solid var(--border);
}

.tview__track:last-child {
  border-bottom: none;
}

.tview__track-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1.25rem;
  gap: 1rem;
}

.tview__track-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.tview__track-tag {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--accent);
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  flex-shrink: 0;
}

.tview__track-name {
  font-size: 0.83rem;
  font-weight: 600;
  color: var(--text-bright);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tview__track-count {
  font-size: 0.72rem;
  font-family: var(--mono);
  color: var(--text-muted);
  flex-shrink: 0;
}

/* ── CLIPS ── */
.tview__clips {
  padding: 0 1.25rem 0.75rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.tview__clip {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.2rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.77rem;
}

.tview__clip:not(.tview__clip--more):hover {
  background: rgba(255,255,255,0.02);
}

.tview__clip-pos {
  font-family: var(--mono);
  color: var(--amber);
  font-size: 0.72rem;
  flex-shrink: 0;
  min-width: 3.5rem;
}

.tview__clip-dur {
  font-family: var(--mono);
  color: var(--text-muted);
  font-size: 0.7rem;
  flex-shrink: 0;
  min-width: 4rem;
}

.tview__clip-name {
  color: var(--text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tview__clip--more {
  color: var(--text-muted);
  font-style: italic;
  font-size: 0.72rem;
}

/* ── WARNINGS ── */
.tview__warnings {
  border-top: 1px solid var(--border);
  padding: 0.75rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.tview__warn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  color: var(--warm);
  padding: 0.5rem 0.75rem;
  background: var(--warm-dim);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 140, 66, 0.15);
}
</style>
