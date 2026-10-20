import React, { useState } from 'react';
import { toBlob, toJpeg } from 'html-to-image';
import JSZip from 'jszip';
import { SantriRecord, ReceiptConfig, ActiveReceiptData } from '../types';
import { ReceiptCard } from './ReceiptCard';
import { RECEIPT_FONTS_CSS } from '../assets/receiptFonts';
import { formatRupiahNumberOnly, angkaTerbilang } from '../utils/terbilang';
import { generateNoNota } from '../utils/sheetService';
import { Archive, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

interface BatchGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: SantriRecord[];
  config: ReceiptConfig;
  classNameTitle: string;
}

export const BatchGeneratorModal: React.FC<BatchGeneratorModalProps> = ({
  isOpen,
  onClose,
  students,
  config,
  classNameTitle,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStudent, setCurrentStudent] = useState<string>('');
  const [completed, setCompleted] = useState(false);
  const [activeTempData, setActiveTempData] = useState<ActiveReceiptData | null>(null);

  if (!isOpen) return null;

  const validStudents = students.filter((s) => s.total > 0);

  const startBatchGeneration = async () => {
    if (validStudents.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setCompleted(false);

    const zip = new JSZip();
    const folder = zip.folder(`Kuitansi_${classNameTitle.replace(/[^a-zA-Z0-9]/g, '_')}`);

    const renderContainer = document.getElementById('batch-render-target');
    if (!renderContainer) {
      setIsProcessing(false);
      return;
    }

    try {
      for (let i = 0; i < validStudents.length; i++) {
        const s = validStudents[i];
        setCurrentStudent(s.nama);

        const receiptData: ActiveReceiptData = {
          noNota: generateNoNota(
            s.no || i + 1,
            s.tanggalRaw,
            s.tanggalFormatted,
            config.customYear || '2026'
          ),
          tanggal: s.tanggalFormatted,
          namaSantri: s.nama,
          kelas: s.kelas,
          tujuanPembayaran: config.paymentPurpose,
          nominal: s.total,
          nominalFormatted: formatRupiahNumberOnly(s.total) + ',-',
          terbilang: angkaTerbilang(s.total),
          keterangan: s.keterangan,
          isLunas: s.keterangan.toUpperCase().includes('LUNAS') || s.total > 0,
          bendaharaName: config.bendaharaName,
          bendaharaTitle: config.bendaharaTitle,
          logoUrl: config.logoUrl,
          ttdUrl: config.ttdUrl,
          institutionName: config.institutionName,
          institutionAddress: config.institutionAddress,
          receiptTitle: config.receiptTitle,
        };

        setActiveTempData(receiptData);

        // Allow DOM to update
        await new Promise((resolve) => setTimeout(resolve, 80));

        const targetEl = document.getElementById('batch-card-inner');
        if (targetEl) {
          const options = {
            quality: 0.95,
            pixelRatio: 2,
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
            blob = await toBlob(targetEl, options);
          } catch (errDirect) {
            console.warn('Batch toBlob direct attempt error, retrying:', errDirect);
            blob = await toBlob(targetEl, options);
          }

          if (!blob) {
            const dataUrl = await toJpeg(targetEl, options);
            const res = await fetch(dataUrl);
            blob = await res.blob();
          }

          if (blob && folder) {
            const safeName = `${String(i + 1).padStart(2, '0')}_${s.nama.replace(/[^a-zA-Z0-9]/g, '_')}.jpeg`;
            folder.file(safeName, blob);
          }
        }

        setProgress(Math.round(((i + 1) / validStudents.length) * 100));
      }

      // Generate Zip
      setCurrentStudent('Mengompres file ZIP...');
      const zipContent = await zip.generateAsync({ type: 'blob' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipContent);
      link.download = `Semua_Kuitansi_${classNameTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Haflah2026.zip`;
      link.click();

      setCompleted(true);
    } catch (err) {
      console.error('Batch generation error:', err);
      alert('Terjadi kesalahan saat membuat paket kuitansi.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative text-slate-800">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Unduh Massal Kuitansi (ZIP)
            </h3>
            <p className="text-xs text-slate-500">
              Kelas: <span className="text-teal-700 font-bold">{classNameTitle}</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-200 text-xs space-y-2 text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500">Total Santri di Kelas:</span>
            <span className="font-bold text-slate-900">{students.length} orang</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Santri yang Memiliki Nominal Pembayaran:</span>
            <span className="font-bold text-emerald-700">
              {validStudents.length} santri
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Format Output:</span>
            <span className="font-mono text-slate-700">Arsip .ZIP berisi JPEG High-Res</span>
          </div>
        </div>

        {validStudents.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Tidak ada data santri dengan nominal pembayaran di kelas ini.</span>
          </div>
        ) : isProcessing ? (
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-xs text-slate-700">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span className="font-medium">Memproses: {currentStudent}</span>
              </span>
              <span className="font-mono font-bold text-teal-700">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 transition-all duration-200 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Harap jangan menutup jendela ini hingga proses download selesai.
            </p>
          </div>
        ) : completed ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2.5 mb-6">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold">Berhasil Membuat Arsip ZIP!</p>
              <p className="text-[11px] text-emerald-700">
                Semua {validStudents.length} kuitansi telah tersimpan ke dalam folder download Anda.
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            {completed ? 'Selesai' : 'Batal'}
          </button>
          {!completed && (
            <button
              onClick={startBatchGeneration}
              disabled={isProcessing || validStudents.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 shadow-sm shadow-teal-600/20 disabled:opacity-50 transition-all"
            >
              <Archive className="w-4 h-4" />
              <span>Mulai Buat & Download ZIP</span>
            </button>
          )}
        </div>

        {/* Hidden render target for off-screen canvas rendering */}
        <div
          id="batch-render-target"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '-9999px',
            pointerEvents: 'none',
          }}
        >
          {activeTempData && (
            <ReceiptCard id="batch-card-inner" data={activeTempData} scale={1} />
          )}
        </div>
      </div>
    </div>
  );
};
