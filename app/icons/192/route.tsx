import { ImageResponse } from 'next/og';

/** PWA icon, 192×192 — referenced from `app/manifest.ts`. The `icon.tsx` convention
 *  only covers the browser-tab favicon slot; a manifest needs fixed-size PNG URLs. */
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
          fontSize: 104,
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        U
      </div>
    ),
    { width: 192, height: 192 },
  );
}
