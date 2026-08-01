import { api } from './client';
import type {
  AdminMasterListItem,
  AuthResponse,
  Banner,
  Booking,
  BookingDetail,
  Category,
  Certificate,
  City,
  Conversation,
  DashboardResponse,
  MasterPublic,
  MasterService,
  MasterStatus,
  Message,
  NotificationItem,
  Paginated,
  PortfolioImage,
  Review,
  ScheduleException,
  UserProfile,
  WorkingDay,
} from './types';

// ---- Auth ----
export const authApi = {
  registerClient: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    cityId: string;
  }) => api.post<AuthResponse>('/auth/register/client', data, false),

  registerMaster: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    cityId: string;
    displayName: string;
    timezone: string;
    bio?: string;
    yearsOfExperience?: number;
  }) => api.post<AuthResponse>('/auth/register/master', data, false),

  login: (data: { email: string; password: string; deviceId?: string }) =>
    api.post<AuthResponse | { challengeToken: string }>('/auth/login', data, false),

  refresh: (refreshToken: string) => api.post<AuthResponse>('/auth/refresh', { refreshToken }, false),

  logout: (refreshToken: string) => api.post<void>('/auth/logout', { refreshToken }),

  logoutAll: () => api.post<void>('/auth/logout-all'),

  forgotPassword: (email: string) => api.post<void>('/auth/forgot-password', { email }, false),

  resetPassword: (token: string, newPassword: string) =>
    api.post<void>('/auth/reset-password', { token, newPassword }, false),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<void>('/auth/password', { currentPassword, newPassword }),
};

// ---- Users ----
export const usersApi = {
  me: () => api.get<UserProfile>('/users/me'),
  updateMe: (data: Record<string, unknown>) => api.patch<UserProfile>('/users/me', data),
  deleteMe: () => api.delete<void>('/users/me'),
  setAvatar: (fileId: string) => api.patch<UserProfile>('/users/me/avatar', { fileId }),
};

// ---- Cities ----
export const citiesApi = {
  list: () => api.get<City[]>('/cities', undefined, false),
};

// ---- Categories ----
export const categoriesApi = {
  tree: () => api.get<Category[]>('/categories', undefined, false),
  bySlug: (slug: string) => api.get<Category>(`/categories/${slug}`, undefined, false),
};

// ---- Masters ----
export const mastersApi = {
  search: (query: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    cityId?: string;
    minRating?: number;
    minPrice?: number;
    maxPrice?: number;
    hasCertificates?: boolean;
    sort?: string;
    availableOn?: string;
  }) => api.get<Paginated<MasterPublic>>('/masters', query, false),

  byId: (id: string) => api.get<MasterPublic>(`/masters/${id}`, undefined, false),

  services: (id: string) => api.get<MasterService[]>(`/masters/${id}/services`, undefined, false),

  availability: (id: string, from: string, to: string, serviceId?: string) =>
    api.get<{ date: string; free: string[]; busy: string[] }[]>(
      `/masters/${id}/availability`,
      { from, to, serviceId },
      false,
    ),

  reviews: (id: string, page = 1, limit = 10, sort: 'recency' | 'rating' = 'recency') =>
    api.get<Paginated<Review>>(`/masters/${id}/reviews`, { page, limit, sort }, false),
};

// ---- Master cabinet (self-service, role: MASTER) ----
export const masterCabinetApi = {
  submit: () => api.post<MasterStatus>('/masters/me/submit'),
  resubmit: () => api.post<MasterStatus>('/masters/me/resubmit'),

  myCategories: () => api.get<string[]>('/masters/me/categories'),
  attachCategory: (categoryId: string) => api.post<void>('/masters/me/categories', { categoryId }),
  detachCategory: (categoryId: string) => api.delete<void>(`/masters/me/categories/${categoryId}`),

  myCertificates: () => api.get<Certificate[]>('/masters/me/certificates'),
  addCertificate: (data: { title: string; issuer?: string; year?: string; fileId?: string }) =>
    api.post<Certificate>('/masters/me/certificates', data),
  removeCertificate: (id: string) => api.delete<void>(`/masters/me/certificates/${id}`),

  myPortfolio: () => api.get<PortfolioImage[]>('/masters/me/portfolio'),
  addPortfolioImage: (fileId: string) => api.post<PortfolioImage>('/masters/me/portfolio', { fileId }),
  reorderPortfolio: (imageIds: string[]) => api.put<void>('/masters/me/portfolio/order', { imageIds }),
  removePortfolioImage: (id: string) => api.delete<void>(`/masters/me/portfolio/${id}`),

  myServices: () => api.get<MasterService[]>('/masters/me/services'),
  createService: (data: {
    categoryId: string;
    title: string;
    description?: string;
    priceType: string;
    price: number;
    currency: string;
    durationMinutes: number;
  }) => api.post<MasterService>('/masters/me/services', data),
  updateService: (id: string, data: Record<string, unknown>) =>
    api.patch<MasterService>(`/masters/me/services/${id}`, data),
  removeService: (id: string) => api.delete<void>(`/masters/me/services/${id}`),

  mySchedule: () => api.get<WorkingDay[]>('/masters/me/schedule'),
  replaceSchedule: (days: WorkingDay[]) => api.put<WorkingDay[]>('/masters/me/schedule', { days }),

  myScheduleExceptions: () => api.get<ScheduleException[]>('/masters/me/schedule/exceptions'),
  addScheduleException: (data: { date: string; isDayOff: boolean; startTime?: string; endTime?: string; note?: string }) =>
    api.post<ScheduleException>('/masters/me/schedule/exceptions', data),
  removeScheduleException: (id: string) => api.delete<void>(`/masters/me/schedule/exceptions/${id}`),
};

// ---- Bookings ----
export const bookingsApi = {
  list: (query: { page?: number; limit?: number; status?: string; from?: string; to?: string } = {}) =>
    api.get<Paginated<Booking>>('/bookings', query),

  byId: (id: string) => api.get<BookingDetail>(`/bookings/${id}`),

  create: (data: { masterId: string; serviceId: string; scheduledAt: string; address?: unknown; note?: string }) =>
    api.post<Booking>('/bookings', data),

  accept: (id: string) => api.post<Booking>(`/bookings/${id}/accept`),
  reject: (id: string, reason: string) => api.post<Booking>(`/bookings/${id}/reject`, { reason }),
  cancel: (id: string, reason?: string) => api.post<Booking>(`/bookings/${id}/cancel`, { reason }),
  start: (id: string) => api.post<Booking>(`/bookings/${id}/start`),
  complete: (id: string) => api.post<Booking>(`/bookings/${id}/complete`),
};

// ---- Reviews ----
export const reviewsApi = {
  create: (data: { bookingId: string; rating: number; comment?: string }) =>
    api.post<Review>('/reviews', data),
  myReviews: () => api.get<Review[]>('/reviews/me'),
  received: () => api.get<Review[]>('/reviews/received'),
  reply: (id: string, body: string) => api.post<Review>(`/reviews/${id}/reply`, { body }),
  update: (id: string, data: { rating?: number; comment?: string }) => api.patch<Review>(`/reviews/${id}`, data),
};

// ---- Notifications ----
export const notificationsApi = {
  list: (query: { page?: number; limit?: number; isRead?: boolean } = {}) =>
    api.get<Paginated<NotificationItem>>('/notifications', query),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.patch<void>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<void>('/notifications/read-all'),
};

// ---- Conversations / Messages ----
export const conversationsApi = {
  list: (query: { page?: number; limit?: number } = {}) =>
    api.get<Paginated<Conversation>>('/conversations', query),
  create: (participantUserId: string) => api.post<Conversation>('/conversations', { participantUserId }),
  messages: (id: string, cursor?: string, limit = 30) =>
    api.get<{ items: Message[]; nextCursor: string | null }>(`/conversations/${id}/messages`, { cursor, limit }),
  send: (id: string, body: string) => api.post<Message>(`/conversations/${id}/messages`, { body }),
  markRead: (id: string) => api.patch<void>(`/conversations/${id}/read`),
};

// ---- Favorites ----
export const favoritesApi = {
  list: () => api.get<MasterPublic[]>('/favorites'),
  add: (masterId: string) => api.post<void>(`/favorites/${masterId}`, undefined),
  remove: (masterId: string) => api.delete<void>(`/favorites/${masterId}`),
};

// ---- Files ----
export const filesApi = {
  presign: (data: { mimeType: string; sizeBytes: number; purpose: string }) =>
    api.post<{ id: string; url: string; expiresAt: string }>('/files/presign', data),
  confirm: (id: string) =>
    api.post<{ id: string; mimeType: string; sizeBytes: number; purpose: string; confirmed: boolean; createdAt: string }>(
      `/files/${id}/confirm`
    ),
  url: (id: string) => api.get<{ url: string; expiresAt: string }>(`/files/${id}/url`),
};

// ---- Banners ----
export const bannersApi = {
  list: () => api.get<Banner[]>('/banners', undefined, false),
};

// ---- Admin ----
export const adminApi = {
  dashboard: () => api.get<DashboardResponse>('/admin/dashboard'),
  categories: {
    create: (data: {
      name: string;
      slug: string;
      parentId?: string;
      description?: string;
      iconFileId?: string;
      sortOrder?: number;
    }) => api.post<Category>('/admin/categories', data),
    update: (
      id: string,
      data: {
        name?: string;
        parentId?: string | null;
        description?: string;
        iconFileId?: string | null;
        sortOrder?: number;
        isActive?: boolean;
      }
    ) => api.patch<Category>(`/admin/categories/${id}`, data),
    remove: (id: string) => api.delete<void>(`/admin/categories/${id}`),
  },
  masters: {
    list: (query: {
      page?: number;
      limit?: number;
      approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
      status?: boolean;
      cityId?: string;
      categoryId?: string;
      search?: string;
    } = {}) => api.get<Paginated<AdminMasterListItem>>('/admin/masters', query),
    approve: (id: string) => api.post<MasterStatus>(`/admin/masters/${id}/approve`),
    reject: (id: string, reason: string) => api.post<MasterStatus>(`/admin/masters/${id}/reject`, { reason }),
    activate: (id: string) => api.post<MasterStatus>(`/admin/masters/${id}/activate`),
    deactivate: (id: string, reason: string) => api.post<MasterStatus>(`/admin/masters/${id}/deactivate`, { reason }),
  },
  bookings: {
    list: (query: Record<string, string | number | boolean | undefined> = {}) =>
      api.get<Paginated<Booking>>('/admin/bookings', query),
    cancel: (id: string, reason: string) => api.post(`/admin/bookings/${id}/cancel`, { reason }),
  },
  reviews: {
    list: (query: Record<string, string | number | boolean | undefined> = {}) =>
      api.get<Paginated<Review>>('/admin/reviews', query),
    hide: (id: string) => api.post(`/admin/reviews/${id}/hide`),
    unhide: (id: string) => api.post(`/admin/reviews/${id}/unhide`),
  },
};
