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
  /** TOTP enrolment confirmed. ADMIN-only feature on the backend. */
  totpEnabled?: boolean;
  emailVerified?: boolean;
  clientProfile?: ClientProfile | null;
  masterProfile?: MasterProfile | null;
}

export interface SavedAddress {
  id: string;
  label: string;
  cityId: string;
  addressLine: string;
  addressDistrict: string;
  contactPhone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  createdAt: string;
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
  /** The master's own precise pin, self-reported via `PATCH /masters/me/location`. Prefer this over cityLatitude/cityLongitude when present. */
  latitude?: number | null;
  longitude?: number | null;
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
  isFastResponder?: boolean;
}

export type LeaderboardBadge = 'TOP_RATED' | 'MOST_BOOKED' | 'FAST_RESPONDER' | 'RISING_STAR';

export interface LeaderboardEntry {
  rank: number;
  badges: LeaderboardBadge[];
  master: MasterPublic;
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

export interface QuickReply {
  id: string;
  text: string;
  sortOrder: number;
  createdAt: string;
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

export const CANCELLATION_REASON_CODES = [
  'CHANGED_MIND',
  'FOUND_ANOTHER_PROVIDER',
  'PRICE_TOO_HIGH',
  'SCHEDULING_CONFLICT',
  'NO_LONGER_NEEDED',
  'UNRESPONSIVE_OTHER_PARTY',
  'EMERGENCY',
  'OTHER',
] as const;

export type CancellationReasonCode = (typeof CANCELLATION_REASON_CODES)[number];

export type PriceType = 'FIXED' | 'HOURLY' | 'FROM';

export type QuoteStatus = 'PENDING' | 'RESPONDED' | 'DECLINED';

export interface Quote {
  id: string;
  masterId: string;
  masterDisplayName: string;
  clientId: string;
  clientName: string;
  serviceId: string | null;
  serviceTitle: string | null;
  description: string;
  status: QuoteStatus;
  estimatedPrice: string | null;
  priceType: string | null;
  masterNote: string | null;
  declineReason: string | null;
  respondedAt: string | null;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  masterId: string;
  /** The master's *user* id — what `POST /reports` takes; `masterId` is their profile. */
  masterUserId?: string;
  masterDisplayName: string;
  clientId: string;
  /** The client's *user* id — what `POST /reports` takes; `clientId` is their profile. */
  clientUserId?: string;
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
  cancellationReasonCode?: CancellationReasonCode | null;
  cancelledByType?: string | null;
  isLateCancellation: boolean;
  rescheduleCount: number;
  attachmentFileIds: string[];
  createdAt: string;
  /** FR-7.7 — what the client says actually changed hands off-platform. Null until confirmed. */
  paidAmount?: string | null;
  paymentNote?: string | null;
  paymentConfirmedAt?: string | null;
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

export interface CompletionCertificate {
  verificationCode: string;
  verifyPath: string;
  issuedAt: string;
  bookingNumber: string;
  serviceTitle: string;
  masterDisplayName: string;
  clientName: string;
  completedAt: string;
}

export interface OptimizedStop {
  order: number;
  bookingId: string;
  bookingNumber: string;
  serviceTitle: string;
  scheduledAt: string;
  district: string;
}

export interface ScheduleOptimizerResult {
  date: string;
  stops: OptimizedStop[];
  totalDistanceKm: number;
  chronologicalDistanceKm: number;
  estimatedSavingsKm: number;
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
   comment?: string | null;
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
  'PAYMENT_CONFIRMED',
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
  'ORDER_PLACED',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Mirrors the backend `AuditAction` enum — drives the admin audit-log filter. */
export const AUDIT_ACTIONS = [
  'MASTER_APPROVED',
  'MASTER_REJECTED',
  'MASTER_ACTIVATED',
  'MASTER_DEACTIVATED',
  'USER_BLOCKED',
  'USER_UNBLOCKED',
  'CATEGORY_CREATED',
  'CATEGORY_UPDATED',
  'CATEGORY_DEACTIVATED',
  'SERVICE_DEACTIVATED',
  'BOOKING_FORCE_CANCELLED',
  'REVIEW_HIDDEN',
  'REVIEW_UNHIDDEN',
  'BANNER_CREATED',
  'BANNER_UPDATED',
  'BANNER_DELETED',
  'NOTIFICATION_BROADCAST',
  'CONVERSATION_ACCESSED',
  'MASTER_STATS_ACCESSED',
  'CERTIFICATE_VERIFIED',
  'CERTIFICATE_REJECTED',
  'REPORT_RESOLVED',
  'PRODUCT_CATEGORY_CREATED',
  'PRODUCT_CATEGORY_UPDATED',
  'PRODUCT_CATEGORY_DELETED',
  'PRODUCT_CREATED',
  'PRODUCT_UPDATED',
  'PRODUCT_DELETED',
  'ORDER_CANCELLED',
  'SHOP_CREATED',
  'SHOP_UPDATED',
  'SHOP_DELETED',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const BANNER_POSITIONS = ['HOME_TOP', 'HOME_MIDDLE', 'CATEGORY_TOP'] as const;
export type BannerPosition = (typeof BANNER_POSITIONS)[number];

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
  /** Short-lived read URL signed by the banners module — `GET /files/:id/url` is uploader-scoped. */
  imageUrl: string | null;
  linkUrl?: string | null;
  position: BannerPosition;
  sortOrder: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** `POST /auth/2fa/setup` — the secret is shown once and never returned again. */
export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
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

export interface PricingSuggestion {
  basis: 'CITY' | 'CATEGORY_WIDE';
  sampleSize: number;
  suggestedMin: string | null;
  suggestedMedian: string | null;
  suggestedMax: string | null;
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
  /** Self-reported precise pin (`PATCH /masters/me/location`); null falls back to the city center. */
  latitude: number | null;
  longitude: number | null;
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

// ---- Marketplace ----
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  price: string;
  oldPrice: string | null;
  discountPercent: number | null;
  currency: string;
  imageUrls: string[];
  isActive: boolean;
  createdAt: string;
}

export interface MarketplaceShop {
  id: string;
  name: string;
  address: string;
  cityId: string;
  cityName: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  imageUrl: string | null;
  unitPrice: string;
  oldPrice: string | null;
  discountPercent: number | null;
  currency: string;
  quantity: number;
  subtotal: string;
  isAvailable: boolean;
}

export interface Cart {
  items: CartItem[];
  totalAmount: string;
  currency: string | null;
}

export type OrderStatus = 'PAID' | 'CANCELLED';

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  totalAmount: string;
  currency: string;
  items: OrderItem[];
  createdAt: string;
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
