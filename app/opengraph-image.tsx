import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 55%, #0EA5E9 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 140,
            height: 140,
            borderRadius: 32,
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            fontSize: 72,
            fontWeight: 800,
            marginBottom: 32,
          }}
        >
          U
        </div>
        <div style={{ display: 'flex', color: '#fff', fontSize: 64, fontWeight: 800 }}>UstoGo</div>
        <div style={{ display: 'flex', color: 'rgba(255,255,255,0.85)', fontSize: 28, marginTop: 12 }}>
          Elite Craftsmen &amp; Home Services Marketplace
        </div>
      </div>
    ),
    { ...size },
  );
}
