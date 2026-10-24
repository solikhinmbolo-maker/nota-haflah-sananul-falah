import React from 'react';
import { SantriRecord } from '../types';
import { formatRupiahNumberOnly } from '../utils/terbilang';
import { isRecordLunas } from '../utils/sheetService';
import {
  Eye,
  Share2,
  CheckCircle,
  Clock,
  Search,
  Filter,
  FileText,
  Archive,
} from 'lucide-react';

interface DataTableViewProps {
  records: SantriRecord[];
  allClasses: string[];
  selectedClass: string;
  onSelectClass: (kelas: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: 'ALL' | 'LUNAS' | 'BELUM_LUNAS';
  onStatusFilterChange: (status: 'ALL' | 'LUNAS' | 'BELUM_LUNAS') => void;
  onOpenReceipt: (santri: SantriRecord) => void;
  onOpenBatchModal: () => void;
  onShareWhatsAppDirect: (santri: SantriRecord) => void;
}

export const DataTableView: React.FC<DataTableViewProps> = ({
  records,
  allClasses,
  selectedClass,
  onSelectClass,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onOpenReceipt,
  onOpenBatchModal,
  onShareWhatsAppDirect,
}) => {
  return (
    <div className="space-y-4">
      {/* Control Bar: Class Filter, Search, Status Tabs */}
      <div className="bg-gradient-to-r from-white via-white to-teal-50/40 border border-teal-200/80 rounded-2xl p-4 shadow-[0_4px_20px_-4px_rgba(13,148,136,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Class Selector Dropdown */}
          <div className="relative min-w-[200px]">
            <select
              value={selectedClass}
              onChange={(e) => onSelectClass(e.target.value)}
              className="w-full bg-white border-2 border-slate-200 hover:border-teal-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 transition-all cursor-pointer appearance-none pr-8 shadow-2xs"
            >
              <option value="">Semua Kelas ({allClasses.length} Kelas)</option>
              {allClasses.map((c) => (
                <option key={c} value={c}>
                  Kelas {c}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari nama santri..."
              className="w-full bg-white border-2 border-slate-200 hover:border-teal-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 transition-all shadow-2xs"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => onStatusFilterChange('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 font-extrabold shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => onStatusFilterChange('LUNAS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === 'LUNAS'
                  ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Lunas
            </button>
            <button
              onClick={() => onStatusFilterChange('BELUM_LUNAS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === 'BELUM_LUNAS'
                  ? 'bg-amber-600 text-white font-extrabold shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Belum Bayar
            </button>
          </div>
        </div>

        {/* Bulk Action Button */}
        {selectedClass && (
          <button
            onClick={onOpenBatchModal}
            className="px-4 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 text-teal-800 border-2 border-teal-300 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all whitespace-nowrap self-start md:self-auto shadow-xs active:scale-95"
          >
            <Archive className="w-3.5 h-3.5 text-teal-700" />
            <span>Unduh Semua Kuitansi ({selectedClass})</span>
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white border border-teal-100 rounded-2xl overflow-hidden shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-teal-100 bg-gradient-to-r from-teal-50/70 via-slate-50 to-white text-slate-700 uppercase tracking-wider font-extrabold text-[11px]">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Santri</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4 text-right">Nominal</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-teal-600" />
                    <p className="font-bold text-slate-800">
                      Tidak ada santri yang sesuai kriteria pencarian
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Coba ganti filter kelas atau kata kunci nama santri.
                    </p>
                  </td>
                </tr>
              ) : (
                records.map((s, idx) => {
                  const isLunas = isRecordLunas(s.keterangan);
                  const hasNominal = s.total > 0;

                  return (
                    <tr
                      key={s.id || idx}
                      className="hover:bg-teal-50/30 transition-colors group"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-500 font-mono text-[11px]">
                        {s.no || idx + 1}
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-slate-900 tracking-wide">
                        {s.nama}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
                        {s.kelas}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {s.tanggalFormatted || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                        {hasNominal ? (
                          `Rp ${formatRupiahNumberOnly(s.total)}`
                        ) : (
                          <span className="text-slate-400 font-normal">Rp 0</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isLunas ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            LUNAS
                          </span>
                        ) : hasNominal ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {s.keterangan || 'CICILAN'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Belum Bayar
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenReceipt(s)}
                            className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-600 text-teal-800 hover:text-white border border-teal-200 hover:border-teal-600 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
                            title="Tampilkan & Cetak Kuitansi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Kuitansi</span>
                          </button>

                          <button
                            onClick={() => onShareWhatsAppDirect(s)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-600 text-slate-600 hover:text-white border border-slate-200 hover:border-emerald-600 transition-colors shadow-2xs active:scale-95"
                            title="Kirim rincian nota via WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
