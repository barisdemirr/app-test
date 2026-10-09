/** Sayfalama biçimleri (rapor 3.9) */
export type CursorPage<T> = { items: T[]; nextCursor: number | string | null };
export type PagedList<T> = { items: T[]; hasMore: boolean };

/** Canlı oturum tipleri (rapor 2.10) */
export type LiveKind = "Voice" | "Lesson";
export type LiveStatus =
  | "Listed"
  | "Open"
  | "Booked"
  | "Pending"
  | "Waiting"
  | "Live"
  | "AwaitingApproval"
  | "Completed"
  | "Cancelled"
  | "Expired";
export type LivePhase = "waiting" | "active" | "finished" | "cancelled";
export type LiveOutcome =
  | "None"
  | "Approved"
  | "AutoApproved"
  | "Rejected"
  | "HostNoShow"
  | "GuestNoShow"
  | "BothNoShow"
  | "NoGuest";
export type MyRole = "host" | "guest" | "none";

export interface LiveParticipant {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface LiveSessionDto {
  id: string;
  channelName: string;
  kind: LiveKind;
  mediaType: "audio" | "video";
  status: LiveStatus;
  phase: LivePhase;
  outcome: LiveOutcome;
  myRole: MyRole;
  canJoin: boolean;
  canBook: boolean;
  peerJoined: boolean;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  price: number;
  payout: number;
  host: LiveParticipant;
  guest: LiveParticipant | null;
  scheduledAtUtc: string | null;
  durationMinutes: number | null;
  joinDeadlineUtc: string | null;
  approvalDeadlineUtc: string | null;
  liveStartedAtUtc: string | null;
  createdAtUtc: string;
  serverNowUtc: string;
}

export interface AgoraDto {
  appId: string;
  channelName: string;
  uid: string;
  token: string;
  expiresAtUtc: string;
  mediaType: "audio" | "video";
}
