/**
 * Build Ableton AudioTrack XML elements.
 */

let _nextId = 100

export function resetIdCounter(start = 100) {
  _nextId = start
}

export function nextId() {
  return _nextId++
}

/**
 * Build an AudioTrack XML string for a given track and its clips.
 *
 * @param {object} track - Track object { id, name, clips }
 * @param {number} trackIndex - 0-based index
 * @param {object} options - { tempo, sampleRate }
 * @returns {string} XML string for this track
 */
export function buildAudioTrackXML(track, trackIndex, options = {}) {
  const { tempo = 120, sampleRate = 48000, timeSignatureNumerator = 4, timeSignatureDenominator = 4 } = options

  const trackId = trackIndex
  const trackName = escapeXML(track.name || `Track ${trackIndex + 1}`)
  const colorIndex = trackIndex % 70

  const autoId1  = nextId()
  const autoId2  = nextId()
  const autoId3  = nextId()
  const autoId4  = nextId()
  const autoId5  = nextId()
  const autoId6  = nextId()
  const autoId7  = nextId()
  const autoId8  = nextId()
  const autoId9  = nextId()
  const autoId10 = nextId()
  const autoId11 = nextId()  // SplitStereoPanL auto
  const autoId12 = nextId()  // SplitStereoPanL mod
  const autoId13 = nextId()  // SplitStereoPanR auto
  const autoId14 = nextId()  // SplitStereoPanR mod
  const autoId15 = nextId()  // CrossFadeState auto
  const mixerPointeeId = nextId()

  // MainSequencer IDs
  const msOnId       = nextId()
  const msPointeeId  = nextId()
  const msVolModId   = nextId()
  const msTrpModId   = nextId()
  const msGrainModId = nextId()
  const msFluxModId  = nextId()
  const msSmpOffId   = nextId()

  // FreezeSequencer IDs
  const fsOnId       = nextId()
  const fsPointeeId  = nextId()
  const fsVolModId   = nextId()
  const fsTrpModId   = nextId()
  const fsGrainModId = nextId()
  const fsFluxModId  = nextId()
  const fsSmpOffId   = nextId()

  const clipsXML = buildClipsXML(track.clips, track.editRate, tempo, sampleRate, timeSignatureNumerator, timeSignatureDenominator)

  // Build 8 empty clip slots for session view
  const clipSlotsXML = Array.from({ length: 8 }, (_, i) => `                <ClipSlot Id="${i}">
                  <LomId Value="0"/>
                  <ClipSlot>
                    <Value/>
                  </ClipSlot>
                  <HasStop Value="true"/>
                  <NeedRefreeze Value="true"/>
                </ClipSlot>`).join('\n')

  return `      <AudioTrack Id="${trackId}">
        <LomId Value="0"/>
        <LomIdView Value="0"/>
        <IsContentSelectedInDocument Value="false"/>
        <PreferredContentViewMode Value="0"/>
        <TrackDelay>
          <Value Value="0"/>
          <IsValueSampleBased Value="false"/>
        </TrackDelay>
        <Name>
          <EffectiveName Value="${trackName}"/>
          <UserName Value=""/>
          <Annotation Value=""/>
          <MemorizedFirstClipName Value=""/>
        </Name>
        <Color Value="${colorIndex}"/>
        <AutomationEnvelopes>
          <Envelopes/>
        </AutomationEnvelopes>
        <TrackGroupId Value="-1"/>
        <TrackUnfolded Value="false"/>
        <DevicesListWrapper LomId="0"/>
        <ClipSlotsListWrapper LomId="0"/>
        <ViewData Value="{}"/>
        <TakeLanes>
          <TakeLanes/>
          <AreTakeLanesFolded Value="true"/>
        </TakeLanes>
        <LinkedTrackGroupId Value="-1"/>
        <SavedPlayingSlot Value="-1"/>
        <SavedPlayingOffset Value="0"/>
        <Freeze Value="false"/>
        <VelocityDetail Value="0"/>
        <NeedArrangerRefreeze Value="true"/>
        <PostProcessFreezeClips Value="0"/>
        <DeviceChain>
          <AutomationLanes>
            <AutomationLanes/>
            <AreAdditionalAutomationLanesFolded Value="false"/>
          </AutomationLanes>
          <ClipEnvelopeChooserViewState>
            <SelectedDevice Value="0"/>
            <SelectedEnvelope Value="0"/>
            <PreferModulationVisible Value="false"/>
          </ClipEnvelopeChooserViewState>
          <AudioInputRouting>
            <Target Value="AudioIn/External/S0"/>
            <UpperDisplayString Value="Ext. In"/>
            <LowerDisplayString Value="1/2"/>
            <MpeSettings>
              <ZoneType Value="0"/>
              <FirstNoteChannel Value="1"/>
              <LastNoteChannel Value="15"/>
            </MpeSettings>
          </AudioInputRouting>
          <MidiInputRouting>
            <Target Value="MidiIn/External.All/-1"/>
            <UpperDisplayString Value="Ext: All Ins"/>
            <LowerDisplayString Value=""/>
            <MpeSettings>
              <ZoneType Value="0"/>
              <FirstNoteChannel Value="1"/>
              <LastNoteChannel Value="15"/>
            </MpeSettings>
          </MidiInputRouting>
          <AudioOutputRouting>
            <Target Value="AudioOut/Master"/>
            <UpperDisplayString Value="Master"/>
            <LowerDisplayString Value=""/>
            <MpeSettings>
              <ZoneType Value="0"/>
              <FirstNoteChannel Value="1"/>
              <LastNoteChannel Value="15"/>
            </MpeSettings>
          </AudioOutputRouting>
          <MidiOutputRouting>
            <Target Value="MidiOut/None"/>
            <UpperDisplayString Value="None"/>
            <LowerDisplayString Value=""/>
            <MpeSettings>
              <ZoneType Value="0"/>
              <FirstNoteChannel Value="1"/>
              <LastNoteChannel Value="15"/>
            </MpeSettings>
          </MidiOutputRouting>
          <Mixer>
            <LomId Value="0"/>
            <LomIdView Value="0"/>
            <IsExpanded Value="true"/>
            <On>
              <LomId Value="0"/>
              <Manual Value="true"/>
              <AutomationTarget Id="${autoId1}">
                <LockEnvelope Value="0"/>
              </AutomationTarget>
              <MidiCCOnOffThresholds>
                <Min Value="64"/>
                <Max Value="127"/>
              </MidiCCOnOffThresholds>
            </On>
            <ModulationSourceCount Value="0"/>
            <ParametersListWrapper LomId="0"/>
            <Pointee Id="${mixerPointeeId}"/>
            <LastSelectedTimeableIndex Value="0"/>
            <LastSelectedClipEnvelopeIndex Value="0"/>
            <LastPresetRef>
              <Value/>
            </LastPresetRef>
            <LockedScripts/>
            <IsFolded Value="false"/>
            <ShouldShowPresetName Value="false"/>
            <UserName Value=""/>
            <Annotation Value=""/>
            <SourceContext>
              <Value/>
            </SourceContext>
            <Sends/>
            <Speaker>
              <LomId Value="0"/>
              <Manual Value="true"/>
              <AutomationTarget Id="${autoId3}">
                <LockEnvelope Value="0"/>
              </AutomationTarget>
              <MidiCCOnOffThresholds>
                <Min Value="64"/>
                <Max Value="127"/>
              </MidiCCOnOffThresholds>
            </Speaker>
            <SoloSink Value="false"/>
            <PanMode Value="0"/>
            <Pan>
              <LomId Value="0"/>
              <Manual Value="0"/>
              <MidiControllerRange>
                <Min Value="-1"/>
                <Max Value="1"/>
              </MidiControllerRange>
              <AutomationTarget Id="${autoId5}">
                <LockEnvelope Value="0"/>
              </AutomationTarget>
              <ModulationTarget Id="${autoId6}">
                <LockEnvelope Value="0"/>
              </ModulationTarget>
            </Pan>
            <SplitStereoPanL>
              <LomId Value="0"/>
              <Manual Value="-1"/>
              <MidiControllerRange>
                <Min Value="-1"/>
                <Max Value="1"/>
              </MidiControllerRange>
              <AutomationTarget Id="${autoId11}">
                <LockEnvelope Value="0"/>
              </AutomationTarget>
              <ModulationTarget Id="${autoId12}">
                <LockEnvelope Value="0"/>
              </ModulationTarget>
            </SplitStereoPanL>
            <SplitStereoPanR>
              <LomId Value="0"/>
              <Manual Value="1"/>
              <MidiControllerRange>
                <Min Value="-1"/>
                <Max Value="1"/>
              </MidiControllerRange>
              <AutomationTarget Id="${autoId13}">
                <LockEnvelope Value="0"/>
              </AutomationTarget>
              <ModulationTarget Id="${autoId14}">
                <LockEnvelope Value="0"/>
              </ModulationTarget>
            </SplitStereoPanR>
            <Volume>
              <LomId Value="0"/>
              <Manual Value="1"/>
              <MidiControllerRange>
                <Min Value="0.0003162277571"/>
                <Max Value="1.99526238"/>
              </MidiControllerRange>
              <AutomationTarget Id="${autoId7}">
                <LockEnvelope Value="0"/>
              </AutomationTarget>
              <ModulationTarget Id="${autoId8}">
                <LockEnvelope Value="0"/>
              </ModulationTarget>
            </Volume>
            <ViewStateSesstionTrackWidth Value="93"/>
            <CrossFadeState>
              <LomId Value="0"/>
              <Manual Value="1"/>
              <AutomationTarget Id="${autoId15}">
                <LockEnvelope Value="0"/>
              </AutomationTarget>
            </CrossFadeState>
            <SendsListWrapper LomId="0"/>
          </Mixer>
          <MainSequencer>
            <LomId Value="0"/>
            <LomIdView Value="0"/>
            <IsExpanded Value="true"/>
            <On>
              <LomId Value="0"/>
              <Manual Value="true"/>
              <AutomationTarget Id="${msOnId}">
                <LockEnvelope Value="0"/>
              </AutomationTarget>
              <MidiCCOnOffThresholds>
                <Min Value="64"/>
                <Max Value="127"/>
              </MidiCCOnOffThresholds>
            </On>
            <ModulationSourceCount Value="0"/>
            <ParametersListWrapper LomId="0"/>
            <Pointee Id="${msPointeeId}"/>
            <LastSelectedTimeableIndex Value="0"/>
            <LastSelectedClipEnvelopeIndex Value="0"/>
            <LastPresetRef>
              <Value/>
            </LastPresetRef>
            <LockedScripts/>
            <IsFolded Value="false"/>
            <ShouldShowPresetName Value="false"/>
            <UserName Value=""/>
            <Annotation Value=""/>
            <SourceContext>
              <Value/>
            </SourceContext>
            <ClipSlotList>
${clipSlotsXML}
            </ClipSlotList>
            <MonitoringEnum Value="2"/>
            <Sample>
              <ArrangerAutomation>
                <Events>
${clipsXML}
                </Events>
                <AutomationTransformViewState>
                  <IsTransformPending Value="false"/>
                  <TimeAndValueTransforms/>
                </AutomationTransformViewState>
              </ArrangerAutomation>
            </Sample>
            <VolumeModulationTarget Id="${msVolModId}">
              <LockEnvelope Value="0"/>
            </VolumeModulationTarget>
            <TranspositionModulationTarget Id="${msTrpModId}">
              <LockEnvelope Value="0"/>
            </TranspositionModulationTarget>
            <GrainSizeModulationTarget Id="${msGrainModId}">
              <LockEnvelope Value="0"/>
            </GrainSizeModulationTarget>
            <FluxModulationTarget Id="${msFluxModId}">
              <LockEnvelope Value="0"/>
            </FluxModulationTarget>
            <SampleOffsetModulationTarget Id="${msSmpOffId}">
              <LockEnvelope Value="0"/>
            </SampleOffsetModulationTarget>
            <PitchViewScrollPosition Value="-1073741824"/>
            <SampleOffsetModulationScrollPosition Value="-1073741824"/>
            <Recorder>
              <IsArmed Value="false"/>
              <TakeCounter Value="1"/>
            </Recorder>
          </MainSequencer>
          <FreezeSequencer>
            <LomId Value="0"/>
            <LomIdView Value="0"/>
            <IsExpanded Value="true"/>
            <On>
              <LomId Value="0"/>
              <Manual Value="true"/>
              <AutomationTarget Id="${fsOnId}">
                <LockEnvelope Value="0"/>
              </AutomationTarget>
              <MidiCCOnOffThresholds>
                <Min Value="64"/>
                <Max Value="127"/>
              </MidiCCOnOffThresholds>
            </On>
            <ModulationSourceCount Value="0"/>
            <ParametersListWrapper LomId="0"/>
            <Pointee Id="${fsPointeeId}"/>
            <LastSelectedTimeableIndex Value="0"/>
            <LastSelectedClipEnvelopeIndex Value="0"/>
            <LastPresetRef>
              <Value/>
            </LastPresetRef>
            <LockedScripts/>
            <IsFolded Value="false"/>
            <ShouldShowPresetName Value="false"/>
            <UserName Value=""/>
            <Annotation Value=""/>
            <SourceContext>
              <Value/>
            </SourceContext>
            <ClipSlotList>
${clipSlotsXML}
            </ClipSlotList>
            <MonitoringEnum Value="1"/>
            <Sample>
              <ArrangerAutomation>
                <Events/>
                <AutomationTransformViewState>
                  <IsTransformPending Value="false"/>
                  <TimeAndValueTransforms/>
                </AutomationTransformViewState>
              </ArrangerAutomation>
            </Sample>
            <VolumeModulationTarget Id="${fsVolModId}">
              <LockEnvelope Value="0"/>
            </VolumeModulationTarget>
            <TranspositionModulationTarget Id="${fsTrpModId}">
              <LockEnvelope Value="0"/>
            </TranspositionModulationTarget>
            <GrainSizeModulationTarget Id="${fsGrainModId}">
              <LockEnvelope Value="0"/>
            </GrainSizeModulationTarget>
            <FluxModulationTarget Id="${fsFluxModId}">
              <LockEnvelope Value="0"/>
            </FluxModulationTarget>
            <SampleOffsetModulationTarget Id="${fsSmpOffId}">
              <LockEnvelope Value="0"/>
            </SampleOffsetModulationTarget>
            <PitchViewScrollPosition Value="-1073741824"/>
            <SampleOffsetModulationScrollPosition Value="-1073741824"/>
            <Recorder>
              <IsArmed Value="false"/>
              <TakeCounter Value="1"/>
            </Recorder>
          </FreezeSequencer>
          <DeviceChain>
            <Devices/>
            <SignalModulations/>
          </DeviceChain>
        </DeviceChain>
      </AudioTrack>`
}

/**
 * Build XML for all clips in a track.
 */
function buildClipsXML(clips, editRate, tempo, sampleRate, timeSigNum = 4, timeSigDen = 4) {
  if (!clips || clips.length === 0) return ''

  return clips
    .filter(clip => clip && (clip.durationBeats > 0 || clip.length > 0))
    .map((clip, i) => buildAudioClipXML(clip, i, editRate, tempo, sampleRate, timeSigNum, timeSigDen))
    .join('\n')
}

/**
 * Convert edit units to Ableton beats.
 */
export function editUnitsToBeat(editUnits, editRate, tempo) {
  // Support both {num,den} and {numerator,denominator} shapes
  const num = editRate ? (editRate.num || editRate.numerator || 0) : 0
  const den = editRate ? (editRate.den || editRate.denominator || 0) : 0
  if (!num || !den) return 0
  const euPerSec = num / den
  if (euPerSec === 0) return 0
  const seconds = editUnits / euPerSec
  return seconds * (tempo / 60)
}

/**
 * Build XML for a single AudioClip.
 * Supports both the new format (positionBeats/durationBeats/inPointBeats)
 * and the legacy format (startTime/length/startPosition in edit units).
 */
function buildAudioClipXML(clip, clipIndex, editRate, tempo, sampleRate, timeSigNum = 4, timeSigDen = 4) {
  const clipId = nextId()

  // New format uses pre-computed beat values (at 60 BPM tempo is already 1:1 with seconds)
  let startBeat, lengthBeats, startRelative
  if (clip.positionBeats != null) {
    startBeat     = clip.positionBeats * (tempo / 60)
    lengthBeats   = clip.durationBeats * (tempo / 60)
    startRelative = (clip.inPointBeats || 0) * (tempo / 60)
  } else {
    startBeat     = editUnitsToBeat(clip.startTime,          editRate, tempo)
    lengthBeats   = editUnitsToBeat(clip.length,             editRate, tempo)
    startRelative = editUnitsToBeat(clip.startPosition || 0, editRate, tempo)
  }

  const endBeat    = startBeat + lengthBeats
  const loopEnd    = startRelative + lengthBeats
  const outMarker  = loopEnd

  // Prefer relative path for embedded WAV files
  const relPath  = clip.wavName ? `Samples/imported/${clip.wavName}` : ''
  const filePath = escapeXML(relPath || clip.filePath || '')
  const clipName = escapeXML(
    clip.wavName
      ? clip.wavName.replace(/\.wav$/i, '')
      : (clip.trackName || getBaseName(clip.filePath) || `Clip ${clipIndex + 1}`)
  )

  const fmt = (n) => Number(n.toFixed(10)).toString()

  // Warp markers: at least two are required (start and end of the audio region).
  // At 60 BPM, SecTime (seconds in the audio file) == BeatTime (beats) 1:1.
  const warpMarkerId0 = nextId()
  const warpMarkerId1 = nextId()
  const warpSecStart  = startRelative   // seconds into the audio file at in-point
  const warpSecEnd    = loopEnd         // seconds at out-point
  const warpMarkersXML = `                      <WarpMarker Id="${warpMarkerId0}" SecTime="${fmt(warpSecStart)}" BeatTime="${fmt(warpSecStart)}"/>
                      <WarpMarker Id="${warpMarkerId1}" SecTime="${fmt(warpSecEnd)}" BeatTime="${fmt(warpSecEnd)}"/>`

  return `                  <AudioClip Id="${clipId}" Time="${fmt(startBeat)}">
                    <LomId Value="0"/>
                    <LomIdView Value="0"/>
                    <CurrentStart Value="${fmt(startBeat)}"/>
                    <CurrentEnd Value="${fmt(endBeat)}"/>
                    <Loop>
                      <LoopStart Value="${fmt(startRelative)}"/>
                      <LoopEnd Value="${fmt(loopEnd)}"/>
                      <StartRelative Value="${fmt(startRelative)}"/>
                      <LoopOn Value="false"/>
                      <OutMarker Value="${fmt(outMarker)}"/>
                      <HiddenLoopStart Value="${fmt(startRelative)}"/>
                      <HiddenLoopEnd Value="${fmt(loopEnd)}"/>
                    </Loop>
                    <Name Value="${clipName}"/>
                    <Annotation Value=""/>
                    <Color Value="-1"/>
                    <LaunchMode Value="0"/>
                    <LaunchQuantisation Value="0"/>
                    <TimeSignature>
                      <TimeSignatures>
                        <RemoteableTimeSignature Id="0">
                          <Numerator Value="${timeSigNum}"/>
                          <Denominator Value="${timeSigDen}"/>
                          <Time Value="0"/>
                        </RemoteableTimeSignature>
                      </TimeSignatures>
                    </TimeSignature>
                    <Envelopes>
                      <Envelopes/>
                    </Envelopes>
                    <ScrollerTimePreserver>
                      <LeftTime Value="${fmt(startBeat)}"/>
                      <RightTime Value="${fmt(endBeat)}"/>
                    </ScrollerTimePreserver>
                    <TimeSelection>
                      <AnchorTime Value="0"/>
                      <OtherTime Value="0"/>
                    </TimeSelection>
                    <Legato Value="false"/>
                    <Ram Value="false"/>
                    <GrooveSettings>
                      <GrooveId Value="-1"/>
                    </GrooveSettings>
                    <Disabled Value="false"/>
                    <VelocityAmount Value="0"/>
                    <FollowAction>
                      <FollowTime Value="4"/>
                      <IsLinked Value="true"/>
                      <LoopIterations Value="1"/>
                      <FollowActionA Value="4"/>
                      <FollowActionB Value="0"/>
                      <FollowChanceA Value="100"/>
                      <FollowChanceB Value="0"/>
                      <JumpIndexA Value="1"/>
                      <JumpIndexB Value="1"/>
                      <FollowActionEnabled Value="false"/>
                    </FollowAction>
                    <Grid>
                      <FixedNumerator Value="1"/>
                      <FixedDenominator Value="16"/>
                      <GridIntervalPixel Value="20"/>
                      <Ntoles Value="2"/>
                      <SnapToGrid Value="true"/>
                      <Fixed Value="false"/>
                    </Grid>
                    <FreezeStart Value="0"/>
                    <FreezeEnd Value="0"/>
                    <IsWarped Value="false"/>
                    <TakeId Value="0"/>
                    <SampleRef>
                      <FileRef>
                        <RelativePathType Value="1"/>
                        <RelativePath Value="${filePath}"/>
                        <Path Value=""/>
                        <Type Value="1"/>
                        <LivePackName Value=""/>
                        <LivePackId Value=""/>
                        <OriginalFileSize Value="0"/>
                        <OriginalCrc Value="0"/>
                      </FileRef>
                      <LastModDate Value="0"/>
                      <SourceContext/>
                      <SampleUsageHint Value="0"/>
                      <DefaultDuration Value="0"/>
                      <DefaultSampleRate Value="${sampleRate}"/>
                    </SampleRef>
                    <Onsets>
                      <UserOnsets/>
                      <HasUserOnsets Value="false"/>
                    </Onsets>
                    <WarpMode Value="0"/>
                    <GranularityTones Value="30"/>
                    <GranularityTexture Value="65"/>
                    <FluctuationTexture Value="25"/>
                    <TransientResolution Value="6"/>
                    <TransientLoopMode Value="2"/>
                    <TransientEnvelope Value="100"/>
                    <ComplexProFormants Value="100"/>
                    <ComplexProEnvelope Value="128"/>
                    <Sync Value="false"/>
                    <HiQ Value="true"/>
                    <Fade Value="true"/>
                    <Fades>
                      <FadeInLength Value="0"/>
                      <FadeOutLength Value="0"/>
                      <ClipFadesAreInitialized Value="true"/>
                      <CrossfadeInState Value="0"/>
                      <FadeInCurveSkew Value="0"/>
                      <FadeInCurveSlope Value="0"/>
                      <FadeOutCurveSkew Value="0"/>
                      <FadeOutCurveSlope Value="0"/>
                      <IsDefaultFadeIn Value="true"/>
                      <IsDefaultFadeOut Value="true"/>
                    </Fades>
                    <PitchCoarse Value="0"/>
                    <PitchFine Value="0"/>
                    <SampleVolume Value="1"/>
                    <WarpMarkers>
${warpMarkersXML}
                    </WarpMarkers>
                    <SavedWarpMarkersForStretched/>
                    <MarkersGenerated Value="false"/>
                    <IsSongTempoMaster Value="false"/>
                  </AudioClip>`
}

function getBaseName(filePath) {
  if (!filePath) return ''
  return filePath.replace(/\\/g, '/').split('/').pop() || ''
}

function escapeXML(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
