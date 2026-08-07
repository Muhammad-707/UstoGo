export type UserRole = 'CLIENT' | 'MASTER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'INACTIVE';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED_BY_CLIENT'
  | 'CANCELLED_BY_MASTER'
  | 'CANCELLED_BY_ADMIN';

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TwoFactorRequiredResponse {
  challengeToken: string;
}

export interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  cityId?: string | null;
  avatarFileId?: string | null;
  defaultAddress?: string | null;
}

export interface MasterProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  bio?: string | null;
  yearsOfExperience: number;
  cityId: string;
  serviceRadiusKm: number;
  timezone: string;
  avatarFileId?: string | null;
  bannerFileId?: string | null;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  isActive: boolean;
  ratingAverage: string;
  ratingCount: number;
  completedBookingsCount: number;
  /** LinkedIn-style WhatsApp number for the master (P0). */
  whatsappPhone?: string | null;
  whatsappEnabled: boolean;
  /** Timestamp of the last number change — used to enforce the 24-hour cooldown. */
  whatsappChangedAt?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: string | null;
  createdAt: string;
  clientProfile?: ClientProfile | null;
  masterProfile?: MasterProfile | null;
}

export interface District {
  id: string;
  name: string;
  slug: string;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  districts?: District[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  iconFileId?: string | null;
  depth: number;
  sortOrder: number;
  isLeaf: boolean;
  children?: Category[];
  ancestors?: Category[];
}

export interface MasterPublic {
  id: string;
  displayName: string;
  avatarFileId?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bannerFileId?: string | null;
  bio?: string | null;
  yearsOfExperience: number;
  serviceRadiusKm: number;
  cityName: string;
  cityLatitude?: number | null;
  cityLongitude?: number | null;
  distanceKm?: number | null;
  categories: string[];
  ratingAverage: string;
  ratingCount: number;
  completedBookingsCount: number;
  priceFrom?: string | null;
  hasCertificates: boolean;
  portfolioImageFileIds?: string[];
  isActive: boolean;
  approvalStatus: ApprovalStatus;
  /** Public WhatsApp contact — the number is present only while whatsappEnabled is true (P0). */
  whatsappEnabled: boolean;
  whatsappPhone: string | null;
}

export interface MasterMedia {
  avatarUrl: string | null;
  bannerUrl: string | null;
  portfolio: Array<{ fileId: string; caption: string | null; url: string }>;
}

export interface MasterCertificatePublic {
  id: string;
  title: string;
  issuedBy?: string | null;
  issuedAt?: string | null;
  verifiedAt?: string | null;
  fileId: string;
}

export interface MasterService {
  id: string;
  categoryId: string;
  title: string;
  description?: string | null;
  priceType: string;
  price: string;
  currency: string;
  durationMinutes: number;
  isActive?: boolean;
}

export interface Certificate {
  id: string;
  title: string;
  issuer?: string | null;
  issuedAt?: string | null;
  fileId?: string | null;
}

export interface PortfolioImage {
  id: string;
  fileId: string;
  caption?: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface WorkingDay {
  id?: string;
  /** 0 = Sunday … 6 = Saturday (matches the backend). */
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface ScheduleException {
  id: string;
  date: string;
  isDayOff: boolean;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  masterId: string;
  masterDisplayName: string;
  clientId: string;
  clientName: string;
  clientPhone?: string | null;
  serviceId: string;
  serviceTitle: string;
  price: string;
  priceType: string;
  currency: string;
  scheduledAt: string;
  endsAt: string;
  durationMinutes: number;
  addressLine?: string | null;
  addressDistrict?: string | null;
  cityId?: string | null;
  contactPhone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  clientNote?: string | null;
  acceptedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  cancelledByType?: string | null;
  isLateCancellation: boolean;
  createdAt: string;
  /** The master's WhatsApp contact — present (non-null) only while whatsappEnabled is true (P0). */
  masterWhatsappEnabled?: boolean;
  masterWhatsappPhone?: string | null;
}

export interface BookingHistoryEntry {
  id: string;
  status: BookingStatus;
  note?: string | null;
  createdAt: string;
}

export interface BookingDetail extends Booking {
  history: BookingHistoryEntry[];
}

export interface DailyEarning {
  date: string;
  total: string;
}

export interface CategoryEarning {
  categoryId: string;
  categoryName: string;
  total: string;
  completedCount: number;
}

export interface MasterStats {
  totalEarnings: string;
  dailyEarnings: DailyEarning[];
  pendingCount: number;
  acceptedCount: number;
  completedCount: number;
  cancelledCount: number;
  completionRate: number;
  earningsByCategory: CategoryEarning[];
  avgAcceptLatencyMinutes: number | null;
  repeatClientRate: number;
  profileViews: number;
}

export interface Review {
   id: string;
   bookingId: string;
   clientId: string;
   clientName?: string;
   masterId: string;
   rating: number;
   clientRating?: number | null;
   comment?: string | null;
   clientComment?: string | null;
   npsScore?: number | null;
   wouldRecommend?: boolean | null;
   status: string;
   editedAt?: string | null;
   createdAt: string;
   reply?: { body: string; createdAt: string } | null;
}

export interface MasterNps {
  nps: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  responseCount: number;
}

export interface NpsByCategory {
  categoryId: string;
  categoryName: string;
  nps: number | null;
  responseCount: number;
}

export interface NpsByMaster {
  masterId: string;
  displayName: string;
  nps: number | null;
  responseCount: number;
}

export interface PlatformNps {
  overallNps: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  responseCount: number;
  byCategory: NpsByCategory[];
  byMaster: NpsByMaster[];
}

export interface MasterStatsMonthPoint {
  month: string;
  bookings: number;
  completed: number;
  revenue: string;
}

export interface MasterStatsTopService {
  serviceId: string;
  title: string;
  completedCount: number;
  revenue: string;
}

export interface AdminMasterStats {
  masterId: string;
  totalClientsServed: number;
  completedJobs: number;
  unfinishedJobs: number;
  avgRating: number;
  ratingCount: number;
  nps: number | null;
  npsResponseCount: number;
  reviewsBreakdown: Record<'1' | '2' | '3' | '4' | '5', number>;
  monthlySeries: MasterStatsMonthPoint[];
  topServices: MasterStatsTopService[];
}

export interface MyReferral {
  code: string;
  referredCount: number;
  rewardCount: number;
  totalBonus: number;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  displayName: string;
  createdAt: string;
  lastLoginAt?: string | null;
}

export type ReportType = 'SPAM' | 'FRAUD' | 'ABUSE' | 'OTHER';
export type ReportStatus = 'OPEN' | 'REVIEWED' | 'RESOLVED' | 'REJECTED';

export interface Report {
  id: string;
  reportedUserId: string;
  type: ReportType;
  description: string;
  status: ReportStatus;
  createdAt: string;
}

export interface AdminReport {
  id: string;
  reporterUserId: string;
  reporterEmail: string;
  reportedUserId: string;
  reportedEmail: string;
  type: ReportType;
  description: string;
  status: ReportStatus;
  adminNote?: string | null;
  resolvedByEmail?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface AdminCertificate {
  id: string;
  masterId: string;
  masterDisplayName: string;
  fileId: string;
  title: string;
  issuedBy?: string | null;
  issuedAt?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

/** B-36 — every `NotificationType` -> enabled. Absence of an override means enabled. */
export const NOTIFICATION_TYPES = [
  'BOOKING_CREATED',
  'BOOKING_ACCEPTED',
  'BOOKING_REJECTED',
  'BOOKING_STARTED',
  'BOOKING_COMPLETED',
  'BOOKING_CANCELLED',
  'BOOKING_EXPIRED',
  'BOOKING_RESCHEDULED',
  'MASTER_REGISTERED',
  'MASTER_APPROVED',
  'MASTER_REJECTED',
  'MASTER_DEACTIVATED',
  'REVIEW_RECEIVED',
  'REVIEW_REPLIED',
  'REVIEW_INVITATION',
  'BOOKING_REMINDER',
  'MESSAGE_RECEIVED',
  'SYSTEM_ANNOUNCEMENT',
  'QUOTE_REQUESTED',
  'QUOTE_RESPONDED',
  'QUOTE_DECLINED',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationPreferences = Record<NotificationType, boolean>;

export interface Conversation {
  id: string;
  participantUserId: string;
  participantName: string;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
  attachments: unknown[];
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  imageFileId: string;
  linkUrl?: string | null;
  position: string;
  sortOrder: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface AdminMasterListItem {
  id: string;
  email: string;
  phone: string | null;
  displayName: string;
  cityName: string;
  categories: string[];
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  ratingAverage: string;
  ratingCount: number;
  priceFrom: string | null;
  createdAt: string;
  completedBookingsCount: number;
  totalEarnings: string;
  /** Raw WhatsApp number regardless of whatsappEnabled — admin can always reach the master (P0). */
  whatsappPhone: string | null;
}

export interface MasterStatus {
  id: string;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  rejectionReason?: string | null;
  /** B-15 — null until the master has any resolved (completed/master-cancelled) booking. */
  reliabilityScore: string | null;
  /** B-24 — opted in to auto-accepting eligible bookings (also needs reliabilityScore >= 90). */
  instantBookEnabled: boolean;
}

export interface Session {
  id: string;
  deviceId: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastActiveAt: string;
  current: boolean;
}

// Matches the real DashboardResponseDto from /admin/dashboard (verified against live Swagger
// at /api/docs-json — the backend has no revenue/monthlyGrowth/verifiedPct concept, so those are
// derived or omitted on the consuming pages rather than fabricated).
export interface DashboardResponse {
  users: { clients: number; masters: number; admins: number; blocked: number };
  masters: { pending: number; approved: number; rejected: number; inactive: number };
  bookings: { pending: number; accepted: number; inProgress: number; completed: number; cancelled: number; expired: number };
  rates: { completionRate: number; cancellationRate: number; acceptanceRate: number };
  reviews: { count: number; averageRating: number };
  topCategories: Array<{ categoryId: string; name: string; bookings: number }>;
  series: Array<{ date: string; created: number; completed: number }>;
}
