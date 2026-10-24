import React, { forwardRef } from 'react';
import { ActiveReceiptData } from '../types';
import { DEFAULT_LOGO_BASE64, DEFAULT_TTD_BASE64 } from '../assets/receiptAssets';

interface ReceiptCardProps {
  data: ActiveReceiptData;
  scale?: number;
  id?: string;
}

export const ReceiptCard = forwardRef<HTMLDivElement, ReceiptCardProps>(
  ({ data, scale = 1, id = 'areaCetak' }, ref) => {
    return (
      <div
        style={{
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top center',
        }}
        className="transition-transform duration-200"
      >
        <div
          ref={ref}
          id={id}
          style={{
            backgroundColor: '#ffffff',
            width: '1150px',
            height: '540px',
            position: 'relative',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            borderRadius: '8px',
            overflow: 'hidden',
            fontFamily: "'Poppins', sans-serif",
            color: '#0f172a',
            userSelect: 'none',
          }}
          className="receipt-print-root relative"
        >
          {/* Watermark Lunas */}
          {data.isLunas && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-25deg)',
                fontSize: '110px',
                fontWeight: 800,
                color: '#ef4444',
                opacity: 0.15,
                letterSpacing: '10px',
                lineHeight: 1,
                zIndex: 1,
                pointerEvents: 'none',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              LUNAS
            </div>
          )}

          {/* Header Container */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '5px',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {/* Kop Melengkung */}
            <div
              style={{
                background:
                  'linear-gradient(135deg, #47bbb7, #1662a9 70%, rgba(22, 98, 169, 0.8))',
                color: '#ffffff',
                width: '60%',
                flexShrink: 0,
                padding: '16px 36px',
                borderBottomRightRadius: '110px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                boxSizing: 'border-box',
              }}
            >
              <img
                src={
                  data.logoUrl && !data.logoUrl.includes('kVycmPgF')
                    ? data.logoUrl
                    : DEFAULT_LOGO_BASE64
                }
                alt="Logo Ponpes"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                style={{
                  width: '95px',
                  height: '95px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                  flexShrink: 0,
                }}
                onError={(e) => {
                  // Fallback if network blocked
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div style={{ minWidth: 0 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '30px',
                    fontWeight: 800,
                    letterSpacing: '0.8px',
                    lineHeight: 1.15,
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {data.institutionName || 'PON-PES SANANUL FALAH'}
                </h3>
                <p
                  style={{
                    margin: '6px 0 0 0',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#f8fafc',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {data.institutionAddress ||
                    'Sendang Mulyo Kec Sendang Agung Kab Lampung Tengah'}
                </p>
              </div>
            </div>

            {/* Info Kanan (No Nota & Tanggal) - Panjang & Garis Ujung Kanan Presisi Sejajar dengan Tabel Bawah (1100px / 50px dari Kanan) */}
            <div
              style={{
                flex: 1,
                padding: '16px 50px 0 20px',
                boxSizing: 'border-box',
                fontSize: '15px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '6px',
                  marginBottom: '10px',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    color: '#499f9e',
                    fontWeight: 800,
                    minWidth: '95px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  No. Kuitansi
                </span>
                <span style={{ color: '#499f9e', fontWeight: 800 }}>:</span>
                <span
                  style={{
                    flex: 1,
                    borderBottom: '2px solid #499f9e',
                    color: '#333333',
                    fontWeight: 700,
                    paddingBottom: '2px',
                    paddingLeft: '4px',
                    textAlign: 'left',
                    fontFamily: "'Plus Jakarta Sans', monospace, sans-serif",
                    letterSpacing: '0.2px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {data.noNota}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '6px',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    color: '#499f9e',
                    fontWeight: 800,
                    minWidth: '95px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Tanggal
                </span>
                <span style={{ color: '#499f9e', fontWeight: 800 }}>:</span>
                <span
                  style={{
                    flex: 1,
                    borderBottom: '2px solid #499f9e',
                    color: '#333333',
                    fontWeight: 700,
                    paddingBottom: '2px',
                    paddingLeft: '4px',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {data.tanggal}
                </span>
              </div>
            </div>
          </div>

          {/* Konten Utama */}
          <div
            style={{
              padding: '0 50px',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {/* Judul Kuitansi */}
            <h1
              style={{
                color: '#499f9e',
                margin: '0 0 10px 0',
                fontSize: '28px',
                fontFamily: "'Times New Roman', Times, serif",
                fontWeight: 'bold',
                letterSpacing: '0.5px',
              }}
            >
              {data.receiptTitle || 'KWITANSI PEMBAYARAN HAFLAH 2026'}
            </h1>

            {/* Tabel Form */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '16px',
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      width: '22%',
                      color: '#499f9e',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      paddingTop: '12px',
                      verticalAlign: 'baseline',
                    }}
                  >
                    Telah diterima dari
                  </td>
                  <td
                    style={{
                      width: '3%',
                      color: '#499f9e',
                      fontWeight: 800,
                      textAlign: 'center',
                      paddingTop: '12px',
                      verticalAlign: 'baseline',
                    }}
                  >
                    :
                  </td>
                  <td
                    style={{
                      borderBottom: '2px solid #499f9e',
                      color: '#333333',
                      fontWeight: 700,
                      paddingBottom: '2px',
                      paddingLeft: '8px',
                      paddingTop: '12px',
                      textTransform: 'uppercase',
                      verticalAlign: 'baseline',
                      fontSize: '17px',
                    }}
                  >
                    {data.namaSantri}
                  </td>
                </tr>

                <tr>
                  <td
                    style={{
                      width: '22%',
                      color: '#499f9e',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      paddingTop: '12px',
                      verticalAlign: 'baseline',
                    }}
                  >
                    Kelas Santri
                  </td>
                  <td
                    style={{
                      width: '3%',
                      color: '#499f9e',
                      fontWeight: 800,
                      textAlign: 'center',
                      paddingTop: '12px',
                      verticalAlign: 'baseline',
                    }}
                  >
                    :
                  </td>
                  <td
                    style={{
                      borderBottom: '2px solid #499f9e',
                      color: '#333333',
                      fontWeight: 600,
                      paddingBottom: '2px',
                      paddingLeft: '8px',
                      paddingTop: '12px',
                      verticalAlign: 'baseline',
                    }}
                  >
                    {data.kelas}
                  </td>
                </tr>

                <tr>
                  <td
                    style={{
                      width: '22%',
                      color: '#499f9e',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      paddingTop: '12px',
                      verticalAlign: 'baseline',
                    }}
                  >
                    Untuk pembayaran
                  </td>
                  <td
                    style={{
                      width: '3%',
                      color: '#499f9e',
                      fontWeight: 800,
                      textAlign: 'center',
                      paddingTop: '12px',
                      verticalAlign: 'baseline',
                    }}
                  >
                    :
                  </td>
                  <td
                    style={{
                      borderBottom: '2px solid #499f9e',
                      color: '#333333',
                      fontWeight: 600,
                      paddingBottom: '2px',
                      paddingLeft: '8px',
                      paddingTop: '12px',
                      textTransform: 'uppercase',
                      verticalAlign: 'baseline',
                    }}
                  >
                    {data.tujuanPembayaran ||
                      'HAFLAH PONPES SANANUL FALAH TH 2026'}
                  </td>
                </tr>

                <tr>
                  <td
                    style={{
                      width: '22%',
                      color: '#499f9e',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      paddingTop: '15px',
                      verticalAlign: 'middle',
                    }}
                  >
                    Nominal sebesar
                  </td>
                  <td
                    style={{
                      width: '3%',
                      color: '#499f9e',
                      fontWeight: 800,
                      textAlign: 'center',
                      paddingTop: '15px',
                      verticalAlign: 'middle',
                    }}
                  >
                    :
                  </td>
                  <td style={{ paddingTop: '15px', verticalAlign: 'middle' }}>
                    <div
                      style={{
                        background: '#e5e5e5',
                        padding: '10px 20px',
                        fontWeight: 700,
                        color: '#222222',
                        width: '100%',
                        boxSizing: 'border-box',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '2px',
                        fontSize: '15px',
                        letterSpacing: '0.2px',
                      }}
                    >
                      {data.terbilang}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Footer Kuitansi */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginTop: '15px',
              }}
            >
              {/* Box Nominal */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  marginBottom: '0px',
                }}
              >
                <span
                  style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    color: '#499f9e',
                  }}
                >
                  Rp.
                </span>
                <div
                  style={{
                    background: '#e5e5e5',
                    padding: '10px 35px',
                    fontSize: '24px',
                    fontWeight: 800,
                    color: '#222222',
                    minWidth: '220px',
                    letterSpacing: '1px',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {data.nominalFormatted}
                </div>
              </div>

              {/* Area Tanda Tangan */}
              <div
                style={{
                  textAlign: 'center',
                  color: '#499f9e',
                  marginRight: '20px',
                  position: 'relative',
                }}
              >
                {/* Stempel Pondok (Digeser ke Kiri Tanda Tangan Sesuai Contoh Resmi) */}
                <img
                  src={data.stampUrl || "/assets/stamp.png"}
                  alt="Stempel Pondok"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  style={{
                    position: 'absolute',
                    top: '52%',
                    left: '-20px',
                    transform: 'translate(-50%, -50%) rotate(-4deg)',
                    width: '138px',
                    height: 'auto',
                    zIndex: 1,
                    opacity: 0.9,
                    pointerEvents: 'none',
                  }}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (!img.src.includes('ibb.co')) {
                      img.src = 'https://i.ibb.co.com/5gBd6yzC/logo-pondok-2.png';
                    }
                  }}
                />

                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '0px',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  {data.bendaharaTitle || 'Bendahara Haflah 2026'}
                </div>

                <img
                  src={
                    data.ttdUrl && !data.ttdUrl.includes('F4JFvHzd')
                      ? data.ttdUrl
                      : DEFAULT_TTD_BASE64
                  }
                  alt="TTD Bendahara"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  style={{
                    height: '125px',
                    width: 'auto',
                    margin: '-15px auto -20px auto',
                    display: 'block',
                    position: 'relative',
                    zIndex: 3,
                  }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.visibility = 'hidden';
                  }}
                />

                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '16px',
                    marginTop: '0px',
                    position: 'relative',
                    zIndex: 4,
                    color: '#499f9e',
                    textDecoration: 'underline',
                  }}
                >
                  {data.bendaharaName || 'IMAM SOLIHIN'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ReceiptCard.displayName = 'ReceiptCard';
