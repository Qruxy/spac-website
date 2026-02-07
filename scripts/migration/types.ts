/**
 * TypeScript interfaces for legacy PHP database records.
 * Maps to the MariaDB tables in localhost.sql.
 */

export interface LegacyMember {
  memID: number;
  email: string | null;
  pEmail: string;
  cEmail: string | null;
  pFirstName: string;
  pMI: string | null;
  pLastName: string;
  cFirstName: string | null;
  cMI: string | null;
  cLastName: string | null;
  street: string;
  city: string;
  state: string;
  zip: string;
  home: string | null;
  pMobile: string | null;
  cMobile: string | null;
  joined: string;
  renew: string;
  membership: string;
  gradDate: string | null;
  password: string | null;
  status: string | null;
  payBy: string;
  pp_txn_id: string | null;
  updatedBy: string;
  ts: string;
}

export interface LegacyApplication {
  appID: number;
  pEmail: string;
  pFirstName: string;
  pMI: string | null;
  pLastName: string;
  cFirstName: string | null;
  cMI: string | null;
  cLastName: string | null;
  street: string;
  city: string;
  state: string;
  zip: string;
  home: string | null;
  pMobile: string | null;
  cMobile: string | null;
  cEmail: string | null;
  joined: string;
  renew: string;
  membership: string;
  gradDate: string | null;
  password: string | null;
  status: string | null;
  payBy: string;
  pp_txn_id: string | null;
  ts: string;
}

export interface LegacyClubOfficer {
  coID: number;
  coMemberNo: number;
  office: string;
  companion: number;
  clubAdmin: number;
  sort: number;
  editedBy: string;
  ts: string;
}

export interface LegacyGeneralMeeting {
  gmID: number;
  meetingDate: string;
  title: string;
  videoLink: string;
  pdfLink: string;
}

export interface LegacyMotion {
  id: number;
  date: string;
  title: string;
  motionedBy: string;
  secondBy: string;
  status: string;
  body: string;
  editedBy: string;
  editedDate: string;
}

export interface LegacyOBSVariable {
  year: number;
  obsStart: string | null;
  regOpens: string | null;
  regCloses: string | null;
  primary_fee: number | null;
  satMealPrice: number | null;
  apparelOpen: string;
  apparelClose: string;
  apparelLink: string;
  updatedBy: string;
  updateDate: string;
}

export interface LegacyOBSFinancial {
  year: number;
  regFee: number;
  cabinFee: number;
  extraNightsFee: number;
  mealsFee: number;
  lateFee: number;
}

export interface LegacyOBSSponsor {
  id: number;
  sort: number;
  sponsor: string;
  website: string;
}

export interface LegacyOBSApplication {
  appID: number;
  email: string;
  pFirstName: string;
  pMI: string | null;
  pLastName: string;
  title: string | null;
  sort: number | null;
  home: string | null;
  pMobile: string | null;
  street: string;
  city: string;
  state: string;
  zip: string;
  cFirstName: string | null;
  cMI: string | null;
  cLastName: string | null;
  cMobile: string | null;
  minor1: string | null;
  minor1age: number | null;
  minor2: string | null;
  minor2age: number | null;
  minor3: string | null;
  minor3age: number | null;
  campingType: string;
  Camper_Type: string;
  rvLength: number | null;
  satMealQty: number | null;
  arrival: string;
  depart: string;
  luncheon: number;
  registration_ext: number;
  camping_ext: number;
  meals_ext: number;
  membership_ext: number;
  acceptance: string;
  Member: string;
  renewing: string;
  joining: string;
  renew: string;
  membership: string | null;
  updatedBy: string;
  ts: string;
}

export interface LegacyOBSAttendeeSimple {
  email: string;
  regDate: string;
  status: string;
  receipt: string;
  payerEmail: string | null;
  updatedBy: string | null;
}

export interface LegacyOBSAttendee2020 {
  obsID: number;
  email: string;
  regDate: string;
  payBy: string;
  status: string;
  receipt: string;
  arrival: string;
  depart: string;
  extra_nights: number;
  camping_type: string;
  rvLength: number;
  meals: number;
  reg_cost: number;
  camping_cost: number;
  extra_cost: number;
  meal_cost: number;
  reg_refund: number;
  apparel: number;
}

export interface LegacyOutreachCommittee {
  memID: number;
  position: string;
  sort: number;
  recEmail: string;
  ocAdmin: number;
  editedBy: string;
  ts: string;
}

export type ParsedTables = Map<string, Record<string, unknown>[]>;
