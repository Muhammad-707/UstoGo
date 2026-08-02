import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/api/client';

let socket: Socket | null = null;
let lastToken: string | null = null;

function socketOrigin(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://ustogo-backend.onrender.com/api/v1';
  return apiUrl.replace(/\/api\/v1\/?$/, '');
}

/** Live push for booking status changes — see BookingsGateway (`/bookings` namespace). */
export function getBookingsSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  const token = getAccessToken();
  if (!token) return null;

  if (socket && lastToken === token) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  lastToken = token;
  socket = io(`${socketOrigin()}/bookings`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2_000,
    reconnectionDelayMax: 10_000,
  });
  socket.on('disconnect', () => {
    socket = null;
    lastToken = null;
  });

  return socket;
}

export function disposeBookingsSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  lastToken = null;
}
