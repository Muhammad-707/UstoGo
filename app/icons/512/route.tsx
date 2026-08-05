import { ImageResponse } from 'next/og';

/** PWA icon, 512×512 — referenced from `app/manifest.ts`. */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2563EB',
          color: '#fff',
          fontSize: 280,
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        U
      </div>
    ),
    { width: 512, height: 512 },
  );
}
