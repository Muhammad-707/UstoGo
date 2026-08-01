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
  approvalStatus: ApprovalStatus;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  isActive: boolean;
  ratingAverage: string;
  ratingCount: number;
  completedBookingsCount: number;
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
  bio?: string | null;
  cityName: string;
  categories: string[];
  ratingAverage: string;
  ratingCount: number;
  completedBookingsCount: number;
  priceFrom?: string | null;
  hasCertificates: boolean;
  portfolioImageFileIds?: string[];
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
  year?: string | null;
  fileId?: string | null;
}

export interface PortfolioImage {
  id: string;
  fileId: string;
  order: number;
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

export interface Review {
  id: string;
  bookingId: string;
  clientId: string;
  masterId: string;
  rating: number;
  comment?: string | null;
  status: string;
  editedAt?: string | null;
  createdAt: string;
  reply?: { body: string; createdAt: string } | null;
}

export interface NotificationItem {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

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
  phone: string;
  firstName: string;
  lastName: string;
  displayName: string;
  city: City;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  createdAt: string;
  rating: number;
  bookingCount: number;
}

export interface MasterStatus {
  id: string;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  rejectionReason?: string | null;
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
