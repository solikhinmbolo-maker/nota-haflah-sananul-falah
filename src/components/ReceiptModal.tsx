import React, { useRef, useState, useEffect } from 'react';
import { toBlob, toJpeg, toPng } from 'html-to-image';
import { ActiveReceiptData } from '../types';
import { ReceiptCard } from './ReceiptCard';
import { RECEIPT_FONTS_CSS } from '../assets/receiptFonts';
import { formatRupiahNumberOnly, angkaTerbilang } from '../utils/terbilang';
import {
  Download,
  X,
  Edit3,
  RotateCcw,
  Sparkles,
  FileType,
} from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ActiveReceiptData | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const [data, setData] = useState<ActiveReceiptData | null>(initialData);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [scale, setScale] = useState(0.85);
  const printRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setData(initialData);
    setIsEditing(false);
  }, [initialData]);

  // Dynamic scale calculation based on window size
  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const availableWidth = Math.min(window.innerWidth - 48, 1200);
      const targetWidth = 1150;
      const calculatedScale = Math.min(Math.max(availableWidth / targetWidth, 0.28), 1);
      setScale(calculatedScale);
    }
    if (isOpen) {
      updateScale();
      window.addEventListener('resize', updateScale);
      return () => window.removeEventListener('resize', updateScale);
    }
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const downloadBlobOrUrl = (blobOrUrl: Blob | string, filename: string) => {
    const link = document.createElement('a');
    if (typeof blobOrUrl === 'string') {
      link.href = blobOrUrl;
    } else {
      link.href = URL.createObjectURL(blobOrUrl);
    }
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      if (typeof blobOrUrl !== 'string') {
        URL.revokeObjectURL(link.href);
      }
    }, 1000);
  };

  // Ultra-HD 4K JPEG Export (pixelRatio 3.5 = 4025 x 1890 px super sharp resolution)
  const handleDownloadJPEG = async () => {
    const targetNode = exportRef.current || printRef.current;
    if (!targetNode) return;
    try {
      setIsDownloading(true);
      setDownloadFormat('JPEG 4K');
      const cleanName = data.namaSantri.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Kuitansi_Haflah_${cleanName}_${data.noNota.replace(/[^a-zA-Z0-9]/g, '-')}_4K.jpeg`;

      const options = {
        quality: 0.99,
        pixelRatio: 3.5, // 3.5x pixel ratio = 4025 x 1890 px Ultra HD 350 DPI
        backgroundColor: '#ffffff',
        width: 1150,
        height: 540,
        fontEmbedCSS: RECEIPT_FONTS_CSS,
        style: {
          transform: 'none',
          boxShadow: 'none',
        },
      };

      let blob: Blob | null = null;
      try {
        blob = await toBlob(targetNode, options);
      } catch (errDirect) {
        console.warn('Direct toBlob failed, retrying:', errDirect);
        blob = await toBlob(targetNode, options);
      }

      if (blob) {
        downloadBlobOrUrl(blob, filename);
      } else {
        const dataUrl = await toJpeg(targetNode, options);
        downloadBlobOrUrl(dataUrl, filename);
      }
    } catch (err) {
      console.error('Error generating JPEG:', err);
      alert(
        'Gagal membuat gambar kuitansi: ' +
          ((err as Error)?.message || 'Silakan coba lagi atau gunakan opsi Cetak.')
      );
    } finally {
      setIsDownloading(false);
      setDownloadFormat('');
    }
  };

  // Ultra-HD PNG Export (Lossless sharp text and graphics)
  const handleDownloadPNG = async () => {
    const targetNode = exportRef.current || printRef.current;
    if (!targetNode) return;
    try {
      setIsDownloading(true);
      setDownloadFormat('PNG HD');
      const cleanName = data.namaSantri.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Kuitansi_Haflah_${cleanName}_HD.png`;

      const options = {
        pixelRatio: 3.5, // 3.5x pixel ratio = 4025 x 1890 px
        backgroundColor: '#ffffff',
        width: 1150,
        height: 540,
        fontEmbedCSS: RECEIPT_FONTS_CSS,
        style: {
          transform: 'none',
          boxShadow: 'none',
        },
      };

      let blob: Blob | null = null;
      try {
        blob = await toBlob(targetNode, { ...options, type: 'image/png' });
      } catch (errDirect) {
        console.warn('Direct PNG toBlob failed, retrying:', errDirect);
        blob = await toBlob(targetNode, { ...options, type: 'image/png' });
      }

      if (blob) {
        downloadBlobOrUrl(blob, filename);
      } else {
        const dataUrl = await toPng(targetNode, options);
        downloadBlobOrUrl(dataUrl, filename);
      }
    } catch (err) {
      console.error('Error generating PNG:', err);
      alert('Gagal membuat gambar PNG: ' + ((err as Error)?.message || 'Silakan coba lagi.'));
    } finally {
      setIsDownloading(false);
      setDownloadFormat('');
    }
  };



  const handleNominalChange = (newVal: string) => {
    const rawNum = parseInt(newVal.replace(/[^0-9]/g, ''), 10) || 0;
    const formatted = formatRupiahNumberOnly(rawNum) + ',-';
    const terbilangStr = angkaTerbilang(rawNum);
    setData((prev) =>
      prev
        ? {
            ...prev,
            nominal: rawNum,
            nominalFormatted: formatted,
            terbilang: terbilangStr,
          }
        : null
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      {/* Toolbar Atas (Bright & Clean) */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-600"></div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-slate-900 tracking-wide flex items-center gap-2">
              Pratinjau Kuitansi Resmi
              <span className="text-xs font-semibold text-slate-500 font-mono">
                ({data.noNota})
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              {data.namaSantri} · {data.kelas}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              isEditing
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Tutup Edit' : 'Edit Cepat'}</span>
          </button>



          {/* PNG High Quality Button */}
          <button
            onClick={handleDownloadPNG}
            disabled={isDownloading}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
            title="Download PNG HD Tanpa Kompresi"
          >
            <FileType className="w-3.5 h-3.5" />
            <span>{isDownloading && downloadFormat === 'PNG HD' ? 'Memproses...' : 'PNG Ultra HD'}</span>
          </button>

          {/* JPEG 4K Ultra HD Button */}
          <button
            onClick={handleDownloadJPEG}
            disabled={isDownloading}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 transition-all shadow-sm shadow-teal-600/20 disabled:opacity-50"
            title="Unduh JPEG Resolusi Tinggi 4025x1890 px"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading && downloadFormat === 'JPEG 4K' ? 'Memproses...' : 'JPEG 4K Ultra HD'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto flex flex-col lg:flex-row relative">
        {/* Editor Panel (Collapsible - Light Theme) */}
        {isEditing && (
          <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-5 space-y-4 shrink-0 overflow-y-auto max-h-72 lg:max-h-full shadow-md z-10">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Penyesuaian Kuitansi
              </span>
              <button
                onClick={() => setData(initialData)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                title="Kembalikan ke data awal"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                No. Kuitansi
              </label>
              <input
                type="text"
                value={data.noNota}
                onChange={(e) =>
                  setData((prev) =>
                    prev ? { ...prev, noNota: e.target.value } : null
                  )
                }
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Tanggal Kuitansi
              </label>
              <input
                type="text"
                value={data.tanggal}
                onChange={(e) =>
                  setData((prev) =>
                    prev ? { ...prev, tanggal: e.target.value } : null
                  )
                }
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Nama Santri
              </label>
              <input
                type="text"
                value={data.namaSantri}
                onChange={(e) =>
                  setData((prev) =>
                    prev ? { ...prev, namaSantri: e.target.value } : null
                  )
                }
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 uppercase font-semibold focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Kelas
              </label>
              <input
                type="text"
                value={data.kelas}
                onChange={(e) =>
                  setData((prev) =>
                    prev ? { ...prev, kelas: e.target.value } : null
                  )
                }
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Nominal (Rp)
              </label>
              <input
                type="text"
                value={data.nominal.toLocaleString('id-ID')}
                onChange={(e) => handleNominalChange(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Terbilang
              </label>
              <textarea
                rows={2}
                value={data.terbilang}
                onChange={(e) =>
                  setData((prev) =>
                    prev ? { ...prev, terbilang: e.target.value } : null
                  )
                }
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 uppercase font-semibold focus:border-teal-600 focus:bg-white focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Tujuan Pembayaran
              </label>
              <input
                type="text"
                value={data.tujuanPembayaran}
                onChange={(e) =>
                  setData((prev) =>
                    prev
                      ? { ...prev, tujuanPembayaran: e.target.value }
                      : null
                  )
                }
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 uppercase focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={data.isLunas}
                  onChange={(e) =>
                    setData((prev) =>
                      prev ? { ...prev, isLunas: e.target.checked } : null
                    )
                  }
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-600 w-4 h-4"
                />
                <span className="font-semibold">Tampilkan Cap / Watermark LUNAS</span>
              </label>
            </div>
          </div>
        )}

        {/* Receipt Visual Canvas Viewport (Soft Desk Gray Canvas) */}
        <div
          ref={containerRef}
          className="flex-1 p-6 md:p-12 flex flex-col items-center justify-center overflow-auto min-h-[500px] bg-slate-200/70"
        >
          <div
            style={{
              width: `${1150 * scale}px`,
              height: `${540 * scale}px`,
            }}
            className="relative flex items-center justify-center transition-all duration-200"
          >
            <ReceiptCard ref={printRef} data={data} scale={scale} />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-700 bg-white/95 backdrop-blur-xs px-5 py-2 rounded-full border border-slate-300 shadow-xs">
            <span className="flex items-center gap-1.5 font-bold text-teal-800">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Hasil Ekspor: 4025 × 1890 px (Ultra HD 4K)
            </span>
            <span className="text-slate-300">•</span>
            <span>Skala Layar: {Math.round(scale * 100)}%</span>
            <span className="text-slate-300">•</span>
            <button
              onClick={handleDownloadPNG}
              className="text-indigo-700 font-bold hover:underline"
            >
              PNG HD
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={handleDownloadJPEG}
              className="text-teal-700 font-bold hover:underline"
            >
              JPEG 4K
            </button>
          </div>
        </div>

        {/* Dedicated 1:1 Pristine Render Target for Instant, Unscaled High-Fidelity Export */}
        <div
          id="receipt-export-node"
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '-9999px',
            width: '1150px',
            height: '540px',
            pointerEvents: 'none',
            zIndex: -9999,
          }}
        >
          <ReceiptCard ref={exportRef} data={data} scale={1} id="areaCetakExport" />
        </div>
      </div>
    </div>
  );
};
