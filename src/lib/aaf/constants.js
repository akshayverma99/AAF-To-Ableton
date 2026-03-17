// AAF Property IDs (PIDs) - observed from real AAF files

// Mob properties
export const PID_MOB_MOBID  = 0x4401  // SF_DATA, 32 bytes = UMID
export const PID_MOB_NAME   = 0x4402  // SF_DATA, UTF-16LE string
export const PID_MOB_SLOTS  = 0x4403  // SF_STRONG_OBJECT_REFERENCE_VECTOR -> "Slots-4403"

// TimelineMobSlot
export const PID_SLOT_EDITRATE = 0x4b01  // SF_DATA, 8 bytes = Rational (int32 num + int32 den)
export const PID_SLOT_ORIGIN   = 0x4b02  // SF_DATA, 8 bytes = Int64
export const PID_SLOT_SEGMENT  = 0x4803  // SF_STRONG_OBJECT_REFERENCE -> "Segment-4803"
export const PID_SLOT_SLOTID   = 0x4804  // SF_DATA, 4 bytes = UInt32

// SourceClip / Component
export const PID_COMP_LENGTH   = 0x0202  // SF_DATA, 8 bytes = Int64 (length in edit units)
export const PID_SRCREF_MOBID  = 0x1101  // SF_DATA, 32 bytes = UMID (target mob, zeros = filler)
export const PID_SRCREF_SLOTID = 0x1102  // SF_DATA, 4 bytes = UInt32
export const PID_SRCCLIP_START = 0x1201  // SF_DATA, 8 bytes = Int64 (start position in source)

// EssenceData
export const PID_ESSDATA_MOBID = 0x2701  // SF_DATA, 32 bytes = UMID (identifies which SourceMob)

// Stored Forms
export const SF_DATA                        = 0x82
export const SF_STRONG_OBJECT_REFERENCE     = 0x22
export const SF_STRONG_OBJECT_REFERENCE_VECTOR = 0x32
export const SF_STRONG_OBJECT_REFERENCE_SET = 0x3A
export const SF_WEAK_OBJECT_REFERENCE       = 0x02
export const SF_DATA_STREAM                 = 0x42

// Legacy export shape kept for any code that imports StoredForms / PIDs as objects
export const StoredForms = {
  SF_DATA,
  SF_STRONG_OBJECT_REFERENCE,
  SF_STRONG_OBJECT_REFERENCE_VECTOR,
  SF_STRONG_OBJECT_REFERENCE_SET,
  SF_WEAK_OBJECT_REFERENCE,
  SF_DATA_STREAM,
}

export const PIDs = {
  Mob_MobID:  PID_MOB_MOBID,
  Mob_Name:   PID_MOB_NAME,
  Mob_Slots:  PID_MOB_SLOTS,

  MobSlot_EditRate: PID_SLOT_EDITRATE,
  MobSlot_Origin:   PID_SLOT_ORIGIN,
  MobSlot_Segment:  PID_SLOT_SEGMENT,
  MobSlot_SlotID:   PID_SLOT_SLOTID,

  Component_Length:              PID_COMP_LENGTH,
  SourceReference_SourceID:      PID_SRCREF_MOBID,
  SourceReference_SourceMobSlotID: PID_SRCREF_SLOTID,
  SourceClip_StartPosition:      PID_SRCCLIP_START,

  EssenceData_MobID: PID_ESSDATA_MOBID,
}
