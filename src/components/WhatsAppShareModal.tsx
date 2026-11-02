import React, { useState, useEffect, useRef } from 'react';
import { toBlob } from 'html-to-image';
import { SantriRecord, ReceiptConfig, ActiveReceiptData } from '../types';
import { ReceiptCard } from './ReceiptCard';
import { RECEIPT_FONTS_CSS } from '../assets/receiptFonts';
import { formatRupiahNumberOnly, angkaTerbilang } from '../utils/terbilang';
import { generateNoNota, isRecordLunas } from '../utils/sheetService';
import {
  Send,
  Copy,
  Check,
  Download,
  ExternalLink,
  Smartphone,
  Laptop,
  Loader2,
  X,
  Sparkles,
  FileCheck,
  Share2,
} from 'lucide-react';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: SantriRecord | null;
  config: ReceiptConfig;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  student,
  config,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [targetPhone, setTargetPhone] = useState('');
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [nativeShareError, setNativeShareError] = useState<string | null>(null);

  const hiddenRenderRef = useRef<HTMLDivElement>(null);

  // Compute active receipt data matching preview exactly
  const receiptData: ActiveReceiptData | null = React.useMemo(() => {
    if (!student) return null;
    const isLunas = isRecordLunas(student.keterangan);
    const nominalValue = student.total > 0 ? student.total : 0;
    const formatted = formatRupiahNumberOnly(nominalValue) + ',-';
    const terbilangStr = angkaTerbilang(nominalValue);
    const studentNo = student.no || 1;
    const yearToUse = config.customYear || '2026';
    const dynamicNoNota = generateNoNota(
      studentNo,
      student.tanggalRaw,
      student.tanggalFormatted,
      yearToUse
    );

    return {
      noNota: dynamicNoNota,
      tanggal: student.tanggalFormatted,
      namaSantri: student.nama,
      kelas: student.kelas,
      tujuanPembayaran: config.paymentPurpose,
      nominal: nominalValue,
      nominalFormatted: formatted,
      terbilang: terbilangStr,
      keterangan: student.keterangan,
      isLunas,
      bendaharaName: config.bendaharaName,
      bendaharaTitle: config.bendaharaTitle,
      logoUrl: config.logoUrl,
      ttdUrl: config.ttdUrl,
      stampUrl: config.stampUrl || '/assets/stamp.png',
      institutionName: config.institutionName,
      institutionAddress: config.institutionAddress,
      receiptTitle: config.receiptTitle,
    };
  }, [student, config]);

  // Generate high quality PNG image and attempt initial copy when modal opens
  useEffect(() => {
    if (!isOpen || !receiptData) {
      setImageBlob(null);
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
        setImageUrl(null);
      }
      setIsCopied(false);
      setNativeShareError(null);
      return;
    }

    let isMounted = true;

    const generateReceiptImage = async () => {
      setIsGenerating(true);
      setIsCopied(false);
      setNativeShareError(null);

      // Brief delay to ensure fonts and assets inside hidden node are ready
      await new Promise((resolve) => setTimeout(resolve, 300));

      const node = hiddenRenderRef.current;
      if (!node) {
        setIsGenerating(false);
        return;
      }

      try {
        const options = {
          pixelRatio: 3.5, // 3.5x pixel ratio = 4025 x 1890 px (Ultra HD 4K)
          backgroundColor: '#ffffff',
          width: 1150,
          height: 540,
          fontEmbedCSS: RECEIPT_FONTS_CSS,
          style: {
            transform: 'none',
            boxShadow: 'none',
          },
        };

        const blob = await toBlob(node, { ...options, type: 'image/png' });
        if (!blob || !isMounted) return;

        setImageBlob(blob);
        const url = URL.createObjectURL(blob);
        setImageUrl(url);

        // Check if Web Share API with files is supported
        if (typeof navigator !== 'undefined' && 'canShare' in navigator) {
          try {
            const testFile = new File([blob], 'test.png', { type: 'image/png' });
            const canShareFiles = navigator.canShare({ files: [testFile] });
            setCanNativeShare(Boolean(canShareFiles));
          } catch {
            setCanNativeShare(false);
          }
        } else {
          setCanNativeShare(false);
        }

        // Automatically copy to clipboard for desktop users
        if (typeof navigator !== 'undefined' && navigator.clipboard && 'ClipboardItem' in window) {
          try {
            const clipboardItem = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([clipboardItem]);
            if (isMounted) setIsCopied(true);
          } catch (copyErr) {
            console.info('Auto clipboard copy skipped (requires direct user click):', copyErr);
          }
        }
      } catch (err) {
        console.error('Error generating receipt for WhatsApp:', err);
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    };

    generateReceiptImage();

    return () => {
      isMounted = false;
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [isOpen, receiptData]);

  if (!isOpen || !student || !receiptData) return null;

  // Manual copy image to clipboard
  const handleCopyImageToClipboard = async () => {
    if (!imageBlob) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && 'ClipboardItem' in window) {
        const clipboardItem = new ClipboardItem({ 'image/png': imageBlob });
        await navigator.clipboard.write([clipboardItem]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 4000);
      } else {
        alert('Browser Anda tidak mendukung salin gambar otomatis. Silakan gunakan tombol Unduh.');
      }
    } catch (err) {
      console.error('Gagal menyalin gambar:', err);
      alert('Gagal menyalin gambar ke clipboard. Silakan gunakan tombol Unduh Cadangan.');
    }
  };

  // Direct native mobile sharing (WhatsApp app directly opens with file)
  const handleNativeShare = async () => {
    if (!imageBlob || !student) return;
    try {
      setNativeShareError(null);
      const cleanName = student.nama.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Kuitansi_Haflah_${cleanName}_${receiptData.noNota.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      const file = new File([imageBlob], filename, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Kuitansi Haflah 2026 - ${student.nama}`,
          text: `Bukti Pembayaran Resmi Haflah 2026 - Ponpes Sananul Falah atas nama ${student.nama} (${student.kelas}).`,
        });
      } else {
        throw new Error('Fitur share langsung tidak didukung di perangkat ini.');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Native share failed:', err);
        setNativeShareError(err.message || 'Gagal membagikan langsung via aplikasi.');
      }
    }
  };

  // Open WhatsApp Web with auto-copied image instructions
  const handleOpenWhatsAppWeb = async () => {
    // Ensure image is copied to clipboard right before opening WhatsApp Web
    if (imageBlob) {
      try {
        const clipboardItem = new ClipboardItem({ 'image/png': imageBlob });
        await navigator.clipboard.write([clipboardItem]);
        setIsCopied(true);
      } catch (e) {
        console.warn('Clipboard write before WA Web:', e);
      }
    }

    let phoneParam = targetPhone.replace(/[^0-9]/g, '');
    if (phoneParam.startsWith('0')) {
      phoneParam = '62' + phoneParam.slice(1);
    }

    let url = 'https://web.whatsapp.com/';
    if (phoneParam) {
      url = `https://web.whatsapp.com/send?phone=${phoneParam}`;
    }

    window.open(url, '_blank');
  };

  // Download backup image
  const handleDownloadBackup = () => {
    if (!imageBlob || !student) return;
    const cleanName = student.nama.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Kuitansi_Haflah_${cleanName}_${receiptData.noNota.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(imageBlob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xs">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                Kirim Nota Langsung ke WhatsApp
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                {student.nama} · Kelas {student.kelas} · {student.noNota}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer text-white"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {/* Visual Receipt Thumbnail */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Nota Fisik Siap Dikirim:
              </span>
              <span className="text-[11px] font-mono text-slate-500 font-semibold">
                Kualitas Asli: 4025 × 1890 px (HD 4K)
              </span>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner flex items-center justify-center min-h-[170px]">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-2 text-slate-500 p-8">
                  <Loader2 className="w-7 h-7 text-teal-600 animate-spin" />
                  <span className="text-xs font-bold">Sedang memproses gambar nota kuitansi kualitas HD...</span>
                </div>
              ) : imageUrl ? (
                <div className="w-full relative group p-2 bg-slate-200/50">
                  <img
                    src={imageUrl}
                    alt="Pratinjau Kuitansi Siap Kirim"
                    className="w-full h-auto rounded-lg shadow-sm border border-slate-200 object-contain max-h-[220px]"
                  />
                  <div className="absolute top-4 right-4 bg-emerald-600/90 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5" />
                    Kualitas 100% Sesuai Pratinjau
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Status Salin Clipboard Banner */}
          <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              {isCopied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-extrabold text-emerald-900 flex items-center gap-2">
                <span>Gambar Nota Siap Dikirim Tanpa Unduh Manual</span>
                {isCopied && (
                  <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Tersalin Otomatis (Ready to Paste)
                  </span>
                )}
              </h4>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                Ketika Anda membuka WhatsApp Web, cukup klik kolom ketik pesan lalu tekan tombol keyboard{' '}
                <kbd className="px-1.5 py-0.5 text-[11px] font-bold bg-white text-emerald-900 border border-emerald-300 rounded-md shadow-2xs">
                  Ctrl + V
                </kbd>{' '}
                (atau klik kanan &gt; Paste). Gambar nota resmi otomatis menempel dalam resolusi penuh!
              </p>
            </div>
          </div>

          {/* Nomor Tujuan Opsional */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Nomor WhatsApp Tujuan (Opsional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: 08123456789 atau kosongkan untuk pilih kontak langsung di WhatsApp"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:border-emerald-600 focus:bg-white focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleCopyImageToClipboard}
                disabled={isGenerating || !imageBlob}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isCopied
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title="Salin gambar nota ke clipboard"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin Gambar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-1">
            {/* Primary Option 1: Mobile Direct App Share (If phone / supported) */}
            {canNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                disabled={isGenerating || !imageBlob}
                className="w-full py-3.5 px-5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 transition-all cursor-pointer active:scale-[0.99]"
              >
                <Smartphone className="w-4 h-4" />
                <span>Kirim Gambar Langsung via Aplikasi WhatsApp (HP)</span>
              </button>
            )}

            {/* Primary Option 2: WhatsApp Web Direct Open */}
            <button
              type="button"
              onClick={handleOpenWhatsAppWeb}
              disabled={isGenerating || !imageBlob}
              className="w-full py-3.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm shadow-emerald-700/20 transition-all cursor-pointer active:scale-[0.99]"
            >
              <Laptop className="w-4 h-4" />
              <span>Buka WhatsApp Web & Tempel Gambar (Ctrl + V)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>

            {/* Secondary Option: Download Backup */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 font-medium">
                Ingin simpan cadangan file kuitansi?
              </span>
              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={isGenerating || !imageBlob}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Unduh Gambar (Cadangan)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hidden 1:1 Pure Resolution Node for Rendering the Exact Receipt */}
        <div
          ref={hiddenRenderRef}
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
          <ReceiptCard data={receiptData} scale={1} id="waShareHiddenTarget" />
        </div>
      </div>
    </div>
  );
};
