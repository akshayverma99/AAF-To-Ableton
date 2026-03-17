<template>
  <div class="tview" v-if="timeline">

    <!-- header row -->
    <div class="tview__header">
      <div class="tview__header-left">
        <span class="tview__label">PROJECT</span>
        <span class="tview__project-name">{{ timeline.name }}</span>
      </div>
      <div class="tview__header-right">
        <span class="tview__stat">{{ timeline.tracks.length }}<span class="tview__stat-label"> tracks</span></span>
        <span class="tview__stat-sep">·</span>
        <span class="tview__stat">{{ totalClips }}<span class="tview__stat-label"> clips</span></span>
        <span class="tview__stat-sep">·</span>
        <span class="tview__stat">{{ duration }}</span>
      </div>
    </div>

    <!-- track rows -->
    <div class="tview__body">
      <div
        v-for="(track, ti) in timeline.tracks"
        :key="ti"
        class="tview__track"
      >
        <!-- track header line -->
        <div class="tview__track-row">
          <span class="tview__tree">{{ ti === timeline.tracks.length - 1 ? '└──' : '├──' }}</span>
          <span class="tview__track-tag">AUDIO</span>
          <span class="tview__track-name">{{ track.name || `Track ${ti + 1}` }}</span>
          <span class="tview__track-meta">{{ track.clips ? track.clips.length : 0 }} clips</span>
        </div>

        <!-- clip rows (show first 6) -->
        <div class="tview__clips">
          <div
            v-for="(clip, ci) in (track.clips || []).slice(0, 6)"
            :key="ci"
            class="tview__clip-row"
          >
            <span class="tview__tree tview__tree--inner">{{ ti === timeline.tracks.length - 1 ? '    ' : '│   ' }}{{ ci === Math.min((track.clips?.length || 0), 6) - 1 ? '└' : '├' }}</span>
            <span class="tview__clip-pos">@{{ fmtTime(clip.positionBeats ?? clip.startTime / 48000) }}</span>
            <span class="tview__clip-dur">{{ fmtDur(clip.durationBeats ?? clip.length / 48000) }}</span>
            <span class="tview__clip-name">{{ clip.wavName ? clip.wavName.replace(/\.wav$/i, '') : (clip.trackName || `clip_${ci}`) }}</span>
          </div>
          <div v-if="(track.clips?.length || 0) > 6" class="tview__clip-more">
            <span class="tview__tree tview__tree--inner">{{ ti === timeline.tracks.length - 1 ? '    ' : '│   ' }}└</span>
            <span class="tview__more-text">… +{{ track.clips.length - 6 }} more clips</span>
          </div>
        </div>
      </div>
    </div>

    <!-- warnings -->
    <div v-if="timeline.warnings?.length" class="tview__warnings">
      <div class="tview__warn-row" v-for="(w, i) in timeline.warnings" :key="i">
        <span class="tview__warn-prefix">[WARN]</span>
        <span>{{ w }}</span>
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
  return `[${sec.toFixed(2)}s]`
}
</script>

<style scoped>
.tview {
  background: var(--bg-panel);
  border: 1px solid var(--border-mid);
  font-size: 0.78rem;
  font-family: var(--font);
}

/* header */
.tview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--border-mid);
  background: var(--bg-elevated);
}

.tview__header-left,
.tview__header-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.tview__label {
  font-family: var(--mono);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--text-dim);
  border: 1px solid var(--border-bright);
  padding: 0.1rem 0.35rem;
}

.tview__project-name {
  font-family: var(--mono);
  color: var(--green);
  font-weight: 600;
}

.tview__stat {
  font-family: var(--mono);
  color: var(--text-bright);
  font-weight: 600;
}

.tview__stat-label {
  font-family: var(--font);
  color: var(--text-dim);
  font-weight: 400;
  font-size: 0.7rem;
}

.tview__stat-sep {
  color: var(--text-dim);
}

/* body */
.tview__body {
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  max-height: 480px;
  overflow-y: auto;
}

.tview__track {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.tview__track-row {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  padding: 0.2rem 0;
  line-height: 1.5;
}

.tview__tree {
  font-family: var(--mono);
  color: var(--text-muted);
  font-size: 0.75rem;
  flex-shrink: 0;
  font-weight: 400;
  user-select: none;
}

.tview__tree--inner {
  font-size: 0.72rem;
}

.tview__track-tag {
  font-family: var(--mono);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--green);
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 0.05rem 0.3rem;
  flex-shrink: 0;
}

.tview__track-name {
  color: var(--text-bright);
  font-weight: 600;
  flex: 1;
}

.tview__track-meta {
  font-family: var(--mono);
  color: var(--text-dim);
  font-size: 0.7rem;
  flex-shrink: 0;
}

/* clips */
.tview__clips {
  display: flex;
  flex-direction: column;
}

.tview__clip-row {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  line-height: 1.6;
  padding: 0;
}

.tview__clip-pos {
  font-family: var(--mono);
  color: var(--cyan);
  opacity: 0.75;
  font-size: 0.72rem;
  flex-shrink: 0;
  min-width: 4rem;
}

.tview__clip-dur {
  font-family: var(--mono);
  color: var(--text-dim);
  font-size: 0.7rem;
  flex-shrink: 0;
  min-width: 4.5rem;
}

.tview__clip-name {
  color: var(--text);
  font-size: 0.73rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tview__clip-more {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  line-height: 1.6;
}

.tview__more-text {
  color: var(--text-dim);
  font-style: italic;
  font-size: 0.72rem;
}

/* warnings */
.tview__warnings {
  border-top: 1px solid var(--border-mid);
  padding: 0.6rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.tview__warn-row {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  font-size: 0.75rem;
  color: var(--yellow);
}

.tview__warn-prefix {
  font-family: var(--mono);
  font-weight: 700;
  flex-shrink: 0;
}
</style>
