import React, { useState, useEffect, useMemo } from 'react';
import {
  SantriRecord,
  ReceiptConfig,
  ActiveReceiptData,
} from './types';
import {
  DEFAULT_SPREADSHEET_ID,
  fetchSheetData,
  getFallbackData,
  generateNoNota,
  isRecordLunas,
} from './utils/sheetService';
import {
  angkaTerbilang,
  formatRupiahNumberOnly,
} from './utils/terbilang';
import { ReceiptModal } from './components/ReceiptModal';
import { BatchGeneratorModal } from './components/BatchGeneratorModal';
import { SettingsModal } from './components/SettingsModal';
import {
  FileText,
  Users,
  RefreshCw,
  Settings,
  CheckCircle,
  Clock,
  ShieldCheck,
  Search,
  BookOpen,
  CreditCard,
  GraduationCap,
  AlertCircle,
} from 'lucide-react';

const DEFAULT_CONFIG: ReceiptConfig = {
  sheetId: DEFAULT_SPREADSHEET_ID,
  institutionName: 'PON-PES SANANUL FALAH',
  institutionSub: 'Haflah Akhirussanah 2026',
  institutionAddress: 'Sendang Mulyo Kec Sendang Agung Kab Lampung Tengah',
  logoUrl: 'https://i.ibb.co.com/kVycmPgF/2019-05-09-1-7.png',
  ttdUrl: 'https://i.ibb.co.com/F4JFvHzd/Ttd-ku-1.png',
  receiptTitle: 'KWITANSI PEMBAYARAN HAFLAH 2026',
  bendaharaName: 'IMAM SOLIHIN',
  bendaharaTitle: 'Bendahara Haflah 2026',
  paymentPurpose: 'HAFLAH PONPES SANANUL FALAH TH 2026',
  customYear: '2026',
  watermarkLunasText: 'LUNAS',
  showWatermark: true,
  stampUrl: '/assets/stamp.png',
};

export default function App() {
  const [config, setConfig] = useState<ReceiptConfig>(() => {
    const saved = localStorage.getItem('sananul_falah_receipt_config');
    if (saved) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  });

  const [records, setRecords] = useState<SantriRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Quick form selection state
  const [quickClass, setQuickClass] = useState<string>('');
  const [quickStudentId, setQuickStudentId] = useState<string>('');
  const [statScope, setStatScope] = useState<'all' | 'class'>('all');

  // Modals
  const [activeReceipt, setActiveReceipt] = useState<ActiveReceiptData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load initial data from Google Sheets
  useEffect(() => {
    loadData();
  }, [config.sheetId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSheetData(config.sheetId);
      setRecords(data);
    } catch (err) {
      console.error(err);
      setRecords(getFallbackData());
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchSheetData(config.sheetId);
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveConfig = (newConfig: ReceiptConfig) => {
    setConfig(newConfig);
    localStorage.setItem('sananul_falah_receipt_config', JSON.stringify(newConfig));
  };

  const handleResetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem('sananul_falah_receipt_config');
  };

  // Distinct classes list
  const allClasses = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.kelas) set.add(r.kelas);
    });
    return Array.from(set).sort();
  }, [records]);

  // Students for the quick dropdown
  const quickStudents = useMemo(() => {
    if (!quickClass) return [];
    return records.filter(
      (r) => r.kelas.trim().toLowerCase() === quickClass.trim().toLowerCase()
    );
  }, [records, quickClass]);

  const selectedQuickStudent = useMemo(() => {
    if (!quickStudentId) return null;
    return records.find((r) => r.id === quickStudentId) || null;
  }, [records, quickStudentId]);

  // Aggregate Stats (Semua Kelas) - Strictly patokan kolom KET dari sheet
  const statsAll = useMemo(() => {
    const totalSantri = records.length;
    let totalDana = 0;
    let lunasCount = 0;
    let totalKekurangan = 0;

    records.forEach((r) => {
      totalDana += r.total || 0;
      totalKekurangan += r.kekurangan || 0;
      if (isRecordLunas(r.keterangan)) lunasCount++;
    });

    return {
      totalSantri,
      totalDana,
      lunasCount,
      belumLunasCount: Math.max(0, totalSantri - lunasCount),
      totalKekurangan,
    };
  }, [records]);

  // Aggregate Stats (Per Kelas Terpilih) - Sinkron dengan kelas yang sedang dipilih
  const statsClass = useMemo(() => {
    if (!quickClass) return null;
    const classRecords = records.filter(
      (r) => r.kelas.trim().toLowerCase() === quickClass.trim().toLowerCase()
    );
    const totalSantri = classRecords.length;
    let totalDana = 0;
    let lunasCount = 0;
    let totalKekurangan = 0;

    classRecords.forEach((r) => {
      totalDana += r.total || 0;
      totalKekurangan += r.kekurangan || 0;
      if (isRecordLunas(r.keterangan)) lunasCount++;
    });

    return {
      totalSantri,
      totalDana,
      lunasCount,
      belumLunasCount: Math.max(0, totalSantri - lunasCount),
      totalKekurangan,
      className: quickClass,
    };
  }, [records, quickClass]);

  const activeStats = statScope === 'class' && statsClass ? statsClass : statsAll;
  const isClassScope = statScope === 'class' && statsClass !== null;

  const openReceiptForStudent = (student: SantriRecord) => {
    // Patokan status Lunas murni dari kolom KET di Google Sheet
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

    const receipt: ActiveReceiptData = {
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

    setActiveReceipt(receipt);
    setIsReceiptOpen(true);
  };

  const handleShareWhatsApp = (student: SantriRecord) => {
    // Patokan status Lunas murni dari kolom KET di Google Sheet
    const isLunas = isRecordLunas(student.keterangan);

    const text =
      `*BUKTI PEMBAYARAN RESMI HAFLAH 2026*\n` +
      `*PON-PES SANANUL FALAH*\n\n` +
      `Assalamu'alaikum Wr. Wb.\n` +
      `Berikut rincian kuitansi pembayaran santri:\n` +
      `• *No. Kuitansi* : ${student.noNota}\n` +
      `• *Nama Santri* : ${student.nama}\n` +
      `• *Kelas* : ${student.kelas}\n` +
      `• *Tanggal* : ${student.tanggalFormatted}\n` +
      `• *Untuk* : ${config.paymentPurpose}\n` +
      `• *Nominal* : Rp ${formatRupiahNumberOnly(student.total)},-\n` +
      `• *Status* : ${isLunas ? '✅ LUNAS' : '⚠️ ' + (student.keterangan || 'BELUM LUNAS')}\n\n` +
      `Tanda terima: *${config.bendaharaName}* (${config.bendaharaTitle})\n` +
      `Syukron Jazakumullah Khairan Katsiran.\nWassalamu'alaikum Wr. Wb.`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5f9] text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* 
        Distinguished Professional Header Bar
        Deep navy-slate background that separates with prestige from the light body,
        matching Dapodik & official institutional administrative portals
      */}
      <header className="bg-[#1e293b] border-b-2 border-teal-500/40 sticky top-0 z-40 shadow-md">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 py-3.5 flex items-center justify-between gap-4">
          {/* Left: Logo Pondok + Nama Pondok */}
          <div className="flex items-center gap-3.5 whitespace-nowrap shrink-0">
            <div className="w-11 h-11 rounded-full bg-white/10 p-0.5 border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
              <img
                src={config.logoUrl || 'https://i.ibb.co.com/kVycmPgF/2019-05-09-1-7.png'}
                alt="Logo Ponpes Sananul Falah"
                className="w-10 h-10 object-contain drop-shadow-xs"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-tight text-white block leading-tight">
                Sananul Falah
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-teal-400 block leading-tight">
                Sistem Nota Haflah 2026/2027
              </span>
            </div>
          </div>

          {/* Right: Sinkron Sheet + Thick Gear Icon for Settings (No Text) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Tombol Sinkron Sheet */}
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="px-3.5 sm:px-4 py-2 text-xs font-bold text-slate-100 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 hover:border-slate-600 rounded-xl shadow-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95"
              title="Sinkronkan data terbaru langsung dari Google Sheets"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-teal-400 ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              />
              <span className="hidden sm:inline">Sinkron Sheet</span>
            </button>

            {/* Tombol Pengaturan: Hanya icon gir tebal tanpa tulisan */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 shadow-xs transition-all cursor-pointer group active:scale-95"
              title="Pengaturan Nota & Spreadsheet"
              aria-label="Pengaturan"
            >
              <Settings className="w-5 h-5 stroke-[2.8] text-slate-200 group-hover:text-teal-300 transition-colors" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Viewport (Full Desktop Layout) */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
        {/* Scope Selector: Semua Kelas vs Kelas Terpilih */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-xs p-3 px-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tampilkan Kotak Ringkasan:
            </span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setStatScope('all')}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  statScope === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua Kelas ({statsAll.totalSantri})
              </button>
              {quickClass && (
                <button
                  type="button"
                  onClick={() => setStatScope('class')}
                  className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    statScope === 'class'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>Kelas {quickClass}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      statScope === 'class'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {statsClass?.totalSantri || 0}
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {isClassScope ? (
              <span>
                Menampilkan data khusus <b>Kelas {quickClass}</b> (Dana: <b>Rp {formatRupiahNumberOnly(activeStats.totalDana)}</b> · Lunas: <b>{activeStats.lunasCount}</b>)
              </span>
            ) : (
              <span>
                Menampilkan data <b>Semua 6 Kelas</b> (Dana: <b>Rp {formatRupiahNumberOnly(statsAll.totalDana)}</b> · Lunas: <b>{statsAll.lunasCount}</b>)
              </span>
            )}
          </div>
        </div>

        {/* Dapodik-Inspired Luxury Metric Cards with Organic Circles & Frosted Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {/* Card 1: Total Santri - Royal Indigo / Purple */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#5d69d6] via-[#6366f1] to-[#4f46e5] text-white rounded-2xl p-6 shadow-[0_8px_25px_-5px_rgba(99,102,241,0.28)] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/[0.12] pointer-events-none group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute right-4 -bottom-10 w-32 h-32 rounded-full bg-white/[0.08] pointer-events-none" />
            <div className="absolute -right-4 top-2 w-24 h-24 rounded-full bg-white/[0.06] pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-xs lg:text-sm font-semibold text-white/90 block tracking-wide">
                  {isClassScope ? `Santri ${quickClass}` : 'Total Santri'}
                </span>
                <span className="text-3xl lg:text-4xl font-black font-mono tabular-nums text-white mt-3 block leading-none">
                  {activeStats.totalSantri}
                </span>
                <span className="text-[11px] font-semibold text-white/80 mt-2 block">
                  {isClassScope ? 'santri di kelas ini' : 'santri terdaftar'}
                </span>
              </div>
              <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/25 shadow-xs shrink-0">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Card 2: Total Dana Masuk - Cyan / Ocean Blue */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#06b6d4] via-[#0ea5e9] to-[#0284c7] text-white rounded-2xl p-6 shadow-[0_8px_25px_-5px_rgba(14,165,233,0.28)] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/[0.12] pointer-events-none group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute right-4 -bottom-10 w-32 h-32 rounded-full bg-white/[0.08] pointer-events-none" />
            <div className="absolute -right-4 top-2 w-24 h-24 rounded-full bg-white/[0.06] pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-xs lg:text-sm font-semibold text-white/90 block tracking-wide">
                  {isClassScope ? `Dana Masuk (${quickClass})` : 'Total Dana Masuk'}
                </span>
                <span className="text-2xl lg:text-3xl xl:text-4xl font-black font-mono tabular-nums text-white mt-3 block leading-none">
                  Rp {formatRupiahNumberOnly(activeStats.totalDana)}
                </span>
                <span className="text-[11px] font-semibold text-white/80 mt-2 block">
                  {isClassScope ? 'kas terhimpun kelas ini' : 'kas terhimpun semua kelas'}
                </span>
              </div>
              <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/25 shadow-xs shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Card 3: Status Lunas - Mint / Fresh Emerald Green */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#10b981] via-[#059669] to-[#047857] text-white rounded-2xl p-6 shadow-[0_8px_25px_-5px_rgba(16,185,129,0.28)] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/[0.12] pointer-events-none group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute right-4 -bottom-10 w-32 h-32 rounded-full bg-white/[0.08] pointer-events-none" />
            <div className="absolute -right-4 top-2 w-24 h-24 rounded-full bg-white/[0.06] pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-xs lg:text-sm font-semibold text-white/90 block tracking-wide">
                  {isClassScope ? `Status Lunas (${quickClass})` : 'Status Lunas'}
                </span>
                <span className="text-3xl lg:text-4xl font-black font-mono tabular-nums text-white mt-3 block leading-none">
                  {activeStats.lunasCount}
                </span>
                <span className="text-[11px] font-semibold text-white/80 mt-2 block">
                  / {activeStats.totalSantri} santri ({activeStats.totalSantri > 0 ? Math.round((activeStats.lunasCount / activeStats.totalSantri) * 100) : 0}%)
                </span>
              </div>
              <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/25 shadow-xs shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Card 4: Total Belum Masuk (Sisa Kekurangan Sheet) - Warm Coral / Tangerine */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#f97316] via-[#ea580c] to-[#d97706] text-white rounded-2xl p-6 shadow-[0_8px_25px_-5px_rgba(249,115,22,0.28)] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/[0.12] pointer-events-none group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute right-4 -bottom-10 w-32 h-32 rounded-full bg-white/[0.08] pointer-events-none" />
            <div className="absolute -right-4 top-2 w-24 h-24 rounded-full bg-white/[0.06] pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-xs lg:text-sm font-semibold text-white/90 block tracking-wide">
                  {isClassScope ? `Belum Masuk (${quickClass})` : 'Total Belum Masuk'}
                </span>
                <span className="text-2xl lg:text-3xl xl:text-4xl font-black font-mono tabular-nums text-white mt-3 block leading-none">
                  Rp {formatRupiahNumberOnly(activeStats.totalKekurangan)}
                </span>
                <span className="text-[11px] font-semibold text-white/80 mt-2 block">
                  {isClassScope
                    ? `${activeStats.belumLunasCount} santri belum lunas di ${quickClass}`
                    : `${activeStats.belumLunasCount} santri belum lunas (semua kelas)`}
                </span>
              </div>
              <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/25 shadow-xs shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Work Area: Executive Card Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Form Selection Box (White Executive Card) */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-7 lg:p-9 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    Cetak Nota Resmi Haflah
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Pondok Pesantren Sananul Falah
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Filter Kelas */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    Pilih Kelas Santri
                  </label>
                  <select
                    value={quickClass}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuickClass(val);
                      setQuickStudentId('');
                      if (val) {
                        setStatScope('class');
                      } else {
                        setStatScope('all');
                      }
                    }}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/10 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="">-- Pilih Kelas Santri --</option>
                    {allClasses.map((c) => (
                      <option key={c} value={c}>
                        Kelas {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Santri */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    Nama Santri
                  </label>
                  <select
                    value={quickStudentId}
                    onChange={(e) => setQuickStudentId(e.target.value)}
                    disabled={!quickClass}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 transition-all cursor-pointer shadow-2xs"
                  >
                    {!quickClass ? (
                      <option value="">Pilih Kelas Dahulu</option>
                    ) : quickStudents.length === 0 ? (
                      <option value="">Tidak ada santri di kelas ini</option>
                    ) : (
                      <>
                        <option value="">-- Pilih Nama Santri --</option>
                        {quickStudents.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nama} ({s.total > 0 ? `Rp ${formatRupiahNumberOnly(s.total)}` : 'Belum Bayar'})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {/* Primary Button: Tampilkan Kuitansi */}
                <button
                  disabled={!selectedQuickStudent}
                  onClick={() => {
                    if (selectedQuickStudent) {
                      openReceiptForStudent(selectedQuickStudent);
                    }
                  }}
                  className={`w-full py-3.5 px-6 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs ${
                    selectedQuickStudent
                      ? 'bg-[#0284c7] hover:bg-[#0369a1] text-white cursor-pointer active:scale-[0.99]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>
                    {selectedQuickStudent
                      ? 'Tampilkan Kuitansi Resmi'
                      : 'Pilih Santri Dahulu'}
                  </span>
                </button>
              </div>
            </div>

            {/* Sync Status Note */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Database otomatis membaca Google Sheets
              </span>
              {quickClass && (
                <button
                  onClick={() => setIsBatchOpen(true)}
                  className="text-teal-700 font-bold hover:underline cursor-pointer"
                >
                  Cetak 1 Kelas ({quickStudents.length})
                </button>
              )}
            </div>
          </div>

          {/* Quick Summary or Instructions (Right Card) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {selectedQuickStudent ? (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-7 lg:p-9 shadow-sm h-full flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md inline-block mb-1.5">
                        {selectedQuickStudent.noNota}
                      </span>
                      <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900 uppercase tracking-tight">
                        {selectedQuickStudent.nama}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 mt-1">
                        Kelas: <span className="text-slate-800 font-bold">{selectedQuickStudent.kelas}</span> · Tanggal: {selectedQuickStudent.tanggalFormatted}
                      </p>
                    </div>

                    <span
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 self-start ${
                        isRecordLunas(selectedQuickStudent.keterangan)
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {isRecordLunas(selectedQuickStudent.keterangan) ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span>{selectedQuickStudent.keterangan || 'BELUM LUNAS'}</span>
                    </span>
                  </div>

                  <div className={`grid grid-cols-1 ${selectedQuickStudent.kekurangan > 0 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 text-xs mb-6`}>
                    <div className="bg-[#f8fafc] p-4 lg:p-5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-bold block text-[11px] uppercase tracking-wider mb-1">
                        Nominal Masuk
                      </span>
                      <span className="text-xl lg:text-2xl font-black font-mono text-slate-900 block">
                        Rp {formatRupiahNumberOnly(selectedQuickStudent.total)},-
                      </span>
                    </div>

                    {selectedQuickStudent.kekurangan > 0 && (
                      <div className="bg-amber-50/60 p-4 lg:p-5 rounded-xl border border-amber-200">
                        <span className="text-amber-800 font-bold block text-[11px] uppercase tracking-wider mb-1">
                          Sisa Kekurangan
                        </span>
                        <span className="text-xl lg:text-2xl font-black font-mono text-amber-900 block">
                          Rp {formatRupiahNumberOnly(selectedQuickStudent.kekurangan)},-
                        </span>
                      </div>
                    )}

                    <div className="bg-[#f8fafc] p-4 lg:p-5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-bold block text-[11px] uppercase tracking-wider mb-1">
                        Terbilang
                      </span>
                      <span className="text-xs lg:text-sm font-bold text-slate-800 block uppercase leading-snug">
                        {angkaTerbilang(selectedQuickStudent.total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => openReceiptForStudent(selectedQuickStudent)}
                    className="px-5 py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Buka & Unduh Kuitansi (1150×540)</span>
                  </button>

                  <button
                    onClick={() => handleShareWhatsApp(selectedQuickStudent)}
                    className="px-5 py-3 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Kirim ke WhatsApp</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center space-y-4 shadow-sm h-full flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                  <Search className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Pilih Santri untuk Menampilkan Dokumen Kuitansi
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Pilih kelas dan nama santri pada formulir di sebelah kiri untuk melihat rincian nota dan mengunduh format JPEG 300 DPI resmi Haflah 2026.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                    Resolusi Cetak 300 DPI
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                    Watermark Lunas Otomatis
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                    Ekspor Massal ZIP 1 Kelas
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 mt-auto shadow-2xs">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 Pon-Pes Sananul Falah · Bendahara: {config.bendaharaName}
          </span>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-teal-700 font-semibold hover:underline transition-colors cursor-pointer"
          >
            Pengaturan Kop & TTD
          </button>
        </div>
      </footer>

      {/* Modals */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        initialData={activeReceipt}
      />

      <BatchGeneratorModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        students={quickStudents.length > 0 ? quickStudents : records}
        config={config}
        classNameTitle={quickClass || 'Semua_Santri'}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={handleSaveConfig}
        onReset={handleResetConfig}
      />
    </div>
  );
}
