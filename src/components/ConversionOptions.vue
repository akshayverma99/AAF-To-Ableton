<template>
  <div class="options">
    <h3 class="options__title">Conversion Settings</h3>

    <div class="options__grid">
      <!-- Tempo -->
      <div class="options__field">
        <label class="options__label" for="tempo">
          Tempo
          <span class="options__unit">BPM</span>
        </label>
        <div class="options__input-group">
          <input
            id="tempo"
            type="number"
            class="options__input"
            :value="modelValue.tempo"
            min="20"
            max="300"
            step="1"
            @input="update('tempo', parseFloat($event.target.value) || 120)"
          />
          <input
            type="range"
            class="options__range"
            :value="modelValue.tempo"
            min="20"
            max="300"
            step="1"
            @input="update('tempo', parseFloat($event.target.value))"
          />
        </div>
      </div>

      <!-- Sample Rate -->
      <div class="options__field">
        <label class="options__label" for="sampleRate">
          Sample Rate
          <span class="options__unit">Hz</span>
        </label>
        <select
          id="sampleRate"
          class="options__select"
          :value="modelValue.sampleRate"
          @change="update('sampleRate', parseInt($event.target.value))"
        >
          <option value="44100">44,100 Hz (CD)</option>
          <option value="48000">48,000 Hz (Broadcast)</option>
          <option value="88200">88,200 Hz</option>
          <option value="96000">96,000 Hz (HD)</option>
        </select>
      </div>

      <!-- Time Signature -->
      <div class="options__field">
        <label class="options__label">Time Signature</label>
        <div class="options__timesig">
          <select
            class="options__select options__select--small"
            :value="modelValue.timeSignatureNumerator"
            @change="update('timeSignatureNumerator', parseInt($event.target.value))"
          >
            <option v-for="n in [2, 3, 4, 5, 6, 7, 8, 9, 12]" :key="n" :value="n">{{ n }}</option>
          </select>
          <span class="options__timesig-sep">/</span>
          <select
            class="options__select options__select--small"
            :value="modelValue.timeSignatureDenominator"
            @change="update('timeSignatureDenominator', parseInt($event.target.value))"
          >
            <option v-for="n in [2, 4, 8, 16]" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
      </div>
    </div>

    <div class="options__presets">
      <span class="options__presets-label">Presets:</span>
      <button class="options__preset-btn" @click="applyPreset('film24')">Film 24fps</button>
      <button class="options__preset-btn" @click="applyPreset('film25')">Film 25fps</button>
      <button class="options__preset-btn" @click="applyPreset('broadcast')">Broadcast</button>
      <button class="options__preset-btn" @click="applyPreset('music')">Music</button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

function update(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const presets = {
  film24: { tempo: 120, sampleRate: 48000, timeSignatureNumerator: 4, timeSignatureDenominator: 4 },
  film25: { tempo: 125, sampleRate: 48000, timeSignatureNumerator: 4, timeSignatureDenominator: 4 },
  broadcast: { tempo: 120, sampleRate: 48000, timeSignatureNumerator: 4, timeSignatureDenominator: 4 },
  music: { tempo: 120, sampleRate: 44100, timeSignatureNumerator: 4, timeSignatureDenominator: 4 },
}

function applyPreset(name) {
  const preset = presets[name]
  if (preset) {
    emit('update:modelValue', { ...props.modelValue, ...preset })
  }
}
</script>

<style scoped>
.options {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
}

.options__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 1.25rem;
  font-family: var(--font-mono);
}

.options__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1rem;
}

.options__field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.options__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
}

.options__unit {
  font-weight: 400;
  color: var(--text-secondary);
  font-size: 0.7rem;
}

.options__input-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.options__input,
.options__select {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  padding: 0.4rem 0.6rem;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
}

.options__input:focus,
.options__select:focus {
  border-color: var(--accent-blue);
}

.options__select option {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.options__range {
  width: 100%;
  accent-color: var(--accent-blue);
  cursor: pointer;
}

.options__timesig {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.options__select--small {
  width: auto;
  min-width: 60px;
}

.options__timesig-sep {
  color: var(--text-secondary);
  font-size: 1.25rem;
  font-family: var(--font-mono);
}

.options__presets {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}

.options__presets-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  margin-right: 0.25rem;
}

.options__preset-btn {
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  padding: 0.25rem 0.6rem;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}

.options__preset-btn:hover {
  color: var(--accent-blue);
  border-color: var(--accent-blue);
  background: var(--bg-primary);
}
</style>
