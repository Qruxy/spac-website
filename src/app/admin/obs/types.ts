// Shared types for the OBS Command Center

export interface ScheduleEvent {
  time: string;
  title: string;
  icon: string;
}

export interface ScheduleDay {
  label: string;
  events: ScheduleEvent[];
}

export interface WhatToBringCategory {
  category: string;
  items: string[];
}

export interface LocationInfo {
  byCar: string;
  camping: string;
}

export interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

export interface OBSConfigSerialized {
  id: string;
  year: number;
  eventName: string;
  startDate: string;
  endDate: string;
  registrationOpens: string;
  registrationCloses: string;
  earlyBirdDeadline: string | null;
  location: string;
  memberPrice: number;
  nonMemberPrice: number;
  earlyBirdDiscount: number;
  campingPrice: number;
  mealPrice: number;
  capacity: number;
  isActive: boolean;
  description: string | null;
  scheduleData: ScheduleDay[] | null;
  whatToBring: WhatToBringCategory[] | null;
  locationInfo: LocationInfo | null;
  statsData: StatItem[] | null;
  createdAt: string;
  updatedAt: string;
  _count: { registrations: number };
}

export interface OBSRegistration {
  id: string;
  obsConfigId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  isMember: boolean;
  userId: string | null;
  registrationType: string;
  campingRequested: boolean;
  mealRequested: boolean;
  dietaryRestrictions: string | null;
  tShirtSize: string | null;
  arrivalDate: string | null;
  departureDate: string | null;
  amountPaid: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentDate: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  badgePrinted: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OBSSponsor {
  id: string;
  obsConfigId: string | null;
  name: string;
  website: string | null;
  logoUrl: string | null;
  sponsorLevel: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface OBSFinancialItem {
  id: string;
  obsConfigId: string;
  category: string;
  description: string;
  amount: string;
  isIncome: boolean;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export type NavSection = 'overview' | 'setup' | 'page-builder' | 'registrations' | 'financials';
