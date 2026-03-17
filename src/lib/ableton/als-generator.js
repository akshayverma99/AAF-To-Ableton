/**
 * Generate a complete Ableton Live Set (.als) XML.
 * The .als format is gzip-compressed XML.
 */
import { buildAudioTrackXML, resetIdCounter, nextId, editUnitsToBeat } from './track-builder.js'

/**
 * Generate the full .als XML string from a timeline model.
 *
 * @param {object} timeline - { name, editRate, tracks, warnings }
 * @param {object} options - { tempo, sampleRate, timeSignatureNumerator, timeSignatureDenominator }
 * @returns {string} Complete XML string
 */
export function generateALSXML(timeline, options = {}) {
  const {
    tempo = 120,
    sampleRate = 48000,
    timeSignatureNumerator = 4,
    timeSignatureDenominator = 4,
  } = options

  resetIdCounter(100)

  const audioTracks = timeline.tracks || []

  const tracksXML = audioTracks
    .map((track, i) => buildAudioTrackXML(track, i, { tempo, sampleRate, timeSignatureNumerator, timeSignatureDenominator }))
    .join('\n')

  // Calculate total length in beats
  let maxBeats = 0
  for (const track of audioTracks) {
    for (const clip of (track.clips || [])) {
      let endBeat
      if (clip.positionBeats != null) {
        endBeat = (clip.positionBeats + clip.durationBeats) * (tempo / 60)
      } else {
        const startBeat = editUnitsToBeat(clip.startTime, track.editRate, tempo)
        endBeat = startBeat + editUnitsToBeat(clip.length, track.editRate, tempo)
      }
      if (endBeat > maxBeats) maxBeats = endBeat
    }
  }

  // Round up to nearest bar
  const beatsPerBar = timeSignatureNumerator
  const totalBars = Math.ceil(maxBeats / beatsPerBar) + 2
  const totalBeats = totalBars * beatsPerBar
  const loopLength = Math.max(16, totalBeats)

  // Master track automation IDs
  const mOn1            = nextId()
  const mSpeaker1       = nextId()
  const mPan1           = nextId()
  const mPan2           = nextId()
  const mSplitL1        = nextId()
  const mSplitL2        = nextId()
  const mSplitR1        = nextId()
  const mSplitR2        = nextId()
  const mVol1           = nextId()
  const mVol2           = nextId()
  const mCrossFadeState = nextId()
  const mTempo1         = nextId()
  const mTempo2         = nextId()
  const mTimeSig1       = nextId()
  const mGroove1        = nextId()
  const mGroove2        = nextId()
  const mCrossFade1     = nextId()
  const mCrossFade2     = nextId()
  const mMixerPointee   = nextId()
  const mFreezeSeqOn       = nextId()
  const mFreezeSeqPointee  = nextId()
  const mFreezeSeqVol      = nextId()
  const mFreezeSeqTrp      = nextId()
  const mFreezeSeqGrain    = nextId()
  const mFreezeSeqFlux     = nextId()
  const mFreezeSeqSmpOff   = nextId()

  // Pre-hear track automation IDs
  const phOn1            = nextId()
  const phSpeaker1       = nextId()
  const phPan1           = nextId()
  const phPan2           = nextId()
  const phSplitL1        = nextId()
  const phSplitL2        = nextId()
  const phSplitR1        = nextId()
  const phSplitR2        = nextId()
  const phVol1           = nextId()
  const phVol2           = nextId()
  const phCrossFadeState = nextId()
  const phMixerPointee   = nextId()

  // NextPointeeId MUST be assigned last — after every ID allocation
  const nextPointeeId = nextId()

  return `<?xml version="1.0" encoding="UTF-8"?>
<Ableton MajorVersion="5" MinorVersion="11.0_433" Creator="Ableton Live 11.0.1" Revision="">
  <LiveSet>
    <NextPointeeId Value="${nextPointeeId}"/>
    <OverwriteProtectionNumber Value="2816"/>
    <LomId Value="0"/>
    <LomIdView Value="0"/>
    <Tracks>
${tracksXML}
    </Tracks>
    <MasterTrack>
      <LomId Value="0"/>
      <LomIdView Value="0"/>
      <IsContentSelectedInDocument Value="false"/>
      <PreferredContentViewMode Value="0"/>
      <TrackDelay>
        <Value Value="0"/>
        <IsValueSampleBased Value="false"/>
      </TrackDelay>
      <Name>
        <EffectiveName Value="Master"/>
        <UserName Value=""/>
        <Annotation Value=""/>
        <MemorizedFirstClipName Value=""/>
      </Name>
      <Color Value="-1"/>
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
          <Target Value="AudioOut/External/S0"/>
          <UpperDisplayString Value="Ext. Out"/>
          <LowerDisplayString Value="1/2"/>
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
            <AutomationTarget Id="${mOn1}">
              <LockEnvelope Value="0"/>
            </AutomationTarget>
            <MidiCCOnOffThresholds>
              <Min Value="64"/>
              <Max Value="127"/>
            </MidiCCOnOffThresholds>
          </On>
          <ModulationSourceCount Value="0"/>
          <ParametersListWrapper LomId="0"/>
          <Pointee Id="${mMixerPointee}"/>
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
            <AutomationTarget Id="${mSpeaker1}">
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
            <AutomationTarget Id="${mPan1}">
              <LockEnvelope Value="0"/>
            </AutomationTarget>
            <ModulationTarget Id="${mPan2}">
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
            <AutomationTarget Id="${mSplitL1}">
              <LockEnvelope Value="0"/>
            </AutomationTarget>
            <ModulationTarget Id="${mSplitL2}">
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
            <AutomationTarget Id="${mSplitR1}">
              <LockEnvelope Value="0"/>
            </AutomationTarget>
            <ModulationTarget Id="${mSplitR2}">
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
            <AutomationTarget Id="${mVol1}">
              <LockEnvelope Value="0"/>
            </AutomationTarget>
            <ModulationTarget Id="${mVol2}">
              <LockEnvelope Value="0"/>
            </ModulationTarget>
          </Volume>
          <ViewStateSesstionTrackWidth Value="93"/>
          <CrossFadeState>
            <LomId Value="0"/>
            <Manual Value="1"/>
            <AutomationTarget Id="${mCrossFadeState}">
              <LockEnvelope Value="0"/>
            </AutomationTarget>
          </CrossFadeState>
          <SendsListWrapper LomId="0"/>
          <Tempo>
            <LomId Value="0"/>
            <Manual Value="${tempo}"/>
            <MidiControllerRange>
              <Min Value="60"/>
              <Max Value="200"/>
            </MidiControllerRange>
            <AutomationTarget Id="${mTempo1}">
              <LockEnvelope Value="0"/>
            </AutomationTarget>
            <ModulationTarget Id="${mTempo2}">
              <LockEnvelope Value="0"/>
            </ModulationTarget>
          </Tempo>
          <TimeSignature>
            <LomId Value="0"/>
            <Manual Value="201"/>
            <AutomationTarget Id="${mTimeSig1}">
              <LockEnvelope Value="0"/>
            </AutomationTarget>
          </TimeSignature>
          <GlobalGrooveAmount>
            <LomId Value="0"/>
            <Manual Value="100"/>
            <MidiControllerRange>
              <Min Value="0"/>
              <Max Value="131.25"/>
            </MidiControllerRange>
            <AutomationTarget Id="${mGroove1}">
              <LockEnvelope Value="0"/>
            </AutomationTarget>
            <ModulationTarget Id="${mGroove2}">
              <LockEnvelope Value="0"/>
            </ModulationTarget>
          </GlobalGrooveAmount>
          <CrossFade>
            <LomId Value="0"/>
            <Manual Value="0"/>
            <MidiControllerRange>
              <Min Value="-1"/>
              <Max Value="1"/>
            </MidiControllerRange>
            <AutomationTarget Id="${mCrossFade1}">
              <LockEnvelope Value="0"/>
            </AutomationTarget>
            <ModulationTarget Id="${mCrossFade2}">
              <LockEnvelope Value="0"/>
            </ModulationTarget>
          </CrossFade>
          <TempoAutomationViewBottom Value="60"/>
          <TempoAutomationViewTop Value="200"/>
        </Mixer>
        <FreezeSequencer>
          <AudioSequencer Id="0">
            <LomId Value="0"/>
            <LomIdView Value="0"/>
            <IsExpanded Value="true"/>
            <On>
              <LomId Value="0"/>
              <Manual Value="true"/>
              <AutomationTarget Id="${mFreezeSeqOn}">
                <LockEnvelope Value="0"/>
              </AutomationTarget>
              <MidiCCOnOffThresholds>
                <Min Value="64"/>
                <Max Value="127"/>
              </MidiCCOnOffThresholds>
            </On>
            <ModulationSourceCount Value="0"/>
            <ParametersListWrapper LomId="0"/>
            <Pointee Id="${mFreezeSeqPointee}"/>
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
            <ClipSlotList/>
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
            <VolumeModulationTarget Id="${mFreezeSeqVol}">
              <LockEnvelope Value="0"/>
            </VolumeModulationTarget>
            <TranspositionModulationTarget Id="${mFreezeSeqTrp}">
              <LockEnvelope Value="0"/>
            </TranspositionModulationTarget>
            <GrainSizeModulationTarget Id="${mFreezeSeqGrain}">
              <LockEnvelope Value="0"/>
            </GrainSizeModulationTarget>
            <FluxModulationTarget Id="${mFreezeSeqFlux}">
              <LockEnvelope Value="0"/>
            </FluxModulationTarget>
            <SampleOffsetModulationTarget Id="${mFreezeSeqSmpOff}">
              <LockEnvelope Value="0"/>
            </SampleOffsetModulationTarget>
            <PitchViewScrollPosition Value="-1073741824"/>
            <SampleOffsetModulationScrollPosition Value="-1073741824"/>
            <Recorder>
              <IsArmed Value="false"/>
              <TakeCounter Value="1"/>
            </Recorder>
          </AudioSequencer>
        </FreezeSequencer>
        <DeviceChain>
          <Devices/>
          <SignalModulations/>
        </DeviceChain>
      </DeviceChain>
    </MasterTrack>
    <PreHearTrack>
      <LomId Value="0"/>
      <LomIdView Value="0"/>
      <IsContentSelectedInDocument Value="false"/>
      <PreferredContentViewMode Value="0"/>
      <TrackDelay>
        <Value Value="0"/>
        <IsValueSampleBased Value="false"/>
      </TrackDelay>
      <Name>
        <EffectiveName Value="Master"/>
        <UserName Value=""/>
        <Annotation Value=""/>
        <MemorizedFirstClipName Value=""/>
      </Name>
      <Color Value="-1"/>
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
          <Target Value="AudioOut/External/S0"/>
          <UpperDisplayString Value="Ext. Out"/>
          <LowerDisplayString Value="1/2"/>
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
            <AutomationTarget Id="${phOn1}">
              <LockEnvelope Value="0"/>
            </AutomationTarget>
            <MidiCCOnOffThresholds>
              <Min Value="64"/>
              <Max Value="127"/>
            </MidiCCOnOffThresholds>
          </On>
          <ModulationSourceCount Value="0"/>
          <ParametersListWrapper LomId="0"/>
          <Pointee Id="${phMixerPointee}"/>
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
            <AutomationTarget Id="${phSpeaker1}">
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
            <AutomationTarget Id="${phPan1}">
              <LockEnvelope Value="0"/>
            </AutomationTarget>
            <ModulationTarget Id="${phPan2}">
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
            <AutomationTarget Id="${phSplitL1}">
              <LockEnvelope Value="0"/>
            </AutomationTarget>
            <ModulationTarget Id="${phSplitL2}">
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
            <AutomationTarget Id="${phSplitR1}">
              <LockEnvelope Value="0"/>
            </AutomationTarget>
            <ModulationTarget Id="${phSplitR2}">
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
            <AutomationTarget Id="${phVol1}">
              <LockEnvelope Value="0"/>
            </AutomationTarget>
            <ModulationTarget Id="${phVol2}">
              <LockEnvelope Value="0"/>
            </ModulationTarget>
          </Volume>
          <ViewStateSesstionTrackWidth Value="74"/>
          <CrossFadeState>
            <LomId Value="0"/>
            <Manual Value="1"/>
            <AutomationTarget Id="${phCrossFadeState}">
              <LockEnvelope Value="0"/>
            </AutomationTarget>
          </CrossFadeState>
          <SendsListWrapper LomId="0"/>
        </Mixer>
        <DeviceChain>
          <Devices/>
          <SignalModulations/>
        </DeviceChain>
      </DeviceChain>
    </PreHearTrack>
    <Scenes>
${Array.from({ length: 8 }, (_, i) => `      <Scene Id="${i}">
        <FollowAction>
          <FollowTime Value="4"/>
          <IsLinked Value="true"/>
          <LoopIterations Value="1"/>
          <FollowActionA Value="4"/>
          <FollowActionB Value="0"/>
          <FollowChanceA Value="100"/>
          <FollowChanceB Value="0"/>
          <JumpIndexA Value="0"/>
          <JumpIndexB Value="0"/>
          <FollowActionEnabled Value="false"/>
        </FollowAction>
        <Name Value=""/>
        <Annotation Value=""/>
        <Color Value="-1"/>
        <Tempo Value="${tempo}"/>
        <IsTempoEnabled Value="false"/>
        <TimeSignatureId Value="201"/>
        <IsTimeSignatureEnabled Value="false"/>
        <LomId Value="0"/>
        <ClipSlotsListWrapper LomId="0"/>
      </Scene>`).join('\n')}
    </Scenes>
    <Transport>
      <PhaseNudgeTempo Value="10"/>
      <LoopOn Value="false"/>
      <LoopStart Value="0"/>
      <LoopLength Value="${loopLength}"/>
      <LoopIsSongStart Value="false"/>
      <CurrentTime Value="0"/>
      <PunchIn Value="false"/>
      <PunchOut Value="false"/>
      <MetronomeTickDuration Value="0"/>
      <DrawMode Value="false"/>
    </Transport>
    <SongMasterValues>
      <SessionScrollerPos X="0" Y="0"/>
    </SongMasterValues>
    <SignalModulations/>
    <GlobalQuantisation Value="4"/>
    <AutoQuantisation Value="0"/>
    <Grid>
      <FixedNumerator Value="1"/>
      <FixedDenominator Value="16"/>
      <GridIntervalPixel Value="20"/>
      <Ntoles Value="2"/>
      <SnapToGrid Value="true"/>
      <Fixed Value="false"/>
    </Grid>
    <ScaleInformation>
      <RootNote Value="0"/>
      <Name Value="Major"/>
    </ScaleInformation>
    <InKey Value="false"/>
    <SmpteFormat Value="0"/>
    <TimeSelection>
      <AnchorTime Value="0"/>
      <OtherTime Value="0"/>
    </TimeSelection>
    <SequencerNavigator>
      <BeatTimeHelper>
        <CurrentZoom Value="2"/>
      </BeatTimeHelper>
      <ScrollerPos X="0" Y="0"/>
      <ClientSize X="1200" Y="600"/>
    </SequencerNavigator>
    <ViewStateExtendedClipProperties Value="false"/>
    <IsContentSplitterOpen Value="false"/>
    <IsExpressionSplitterOpen Value="false"/>
    <ExpressionLanes>
      <ExpressionLane Id="0">
        <Type Value="0"/>
        <Size Value="27"/>
        <IsMinimized Value="false"/>
      </ExpressionLane>
    </ExpressionLanes>
    <ContentLanes>
      <ExpressionLane Id="0">
        <Type Value="4"/>
        <Size Value="68"/>
        <IsMinimized Value="false"/>
      </ExpressionLane>
    </ContentLanes>
    <ViewStateFxSlotCount Value="4"/>
    <ViewStateSessionMixerHeight Value="120"/>
    <Locators>
      <Locators/>
    </Locators>
    <DetailClipKeyMidis/>
    <TracksListWrapper LomId="0"/>
    <VisibleTracksListWrapper LomId="0"/>
    <ReturnTracksListWrapper LomId="0"/>
    <ScenesListWrapper LomId="0"/>
    <CuePointsListWrapper LomId="0"/>
    <ChooserBar Value="0"/>
    <Annotation Value=""/>
    <SoloOrPflSavedValue Value="true"/>
    <SoloInPlace Value="true"/>
    <CrossfadeCurve Value="2"/>
    <LatencyCompensation Value="2"/>
    <HighlightedTrackIndex Value="0"/>
    <GroovePool>
      <LomId Value="0"/>
      <Grooves/>
    </GroovePool>
    <AutomationMode Value="false"/>
    <SnapAutomationToGrid Value="true"/>
    <ArrangementOverdub Value="false"/>
    <ColorSequenceIndex Value="0"/>
    <AutoColorPickerForPlayerAndGroupTracks>
      <NextColorIndex Value="0"/>
    </AutoColorPickerForPlayerAndGroupTracks>
    <AutoColorPickerForReturnAndMasterTracks>
      <NextColorIndex Value="0"/>
    </AutoColorPickerForReturnAndMasterTracks>
    <VideoWindowRect Top="-2147483648" Left="-2147483648" Bottom="-2147483648" Right="-2147483648"/>
    <ShowVideoWindow Value="false"/>
    <TrackHeaderWidth Value="157"/>
    <ViewStateArrangerHasDetail Value="true"/>
    <ViewStateSessionHasDetail Value="true"/>
    <ViewStateDetailIsSample Value="true"/>
    <ViewStates>
      <SessionIO Value="0"/>
      <SessionSends Value="1"/>
      <SessionReturns Value="1"/>
      <SessionMixer Value="1"/>
      <SessionTrackDelay Value="0"/>
      <SessionCrossFade Value="0"/>
      <SessionShowOverView Value="0"/>
      <ArrangerIO Value="0"/>
      <ArrangerReturns Value="1"/>
      <ArrangerMixer Value="1"/>
      <ArrangerTrackDelay Value="0"/>
      <ArrangerShowOverView Value="1"/>
    </ViewStates>
  </LiveSet>
</Ableton>`
}
