import React, { useState } from 'react';
import { ReceiptConfig } from '../types';
import { Settings, Save, RotateCcw, X, Image, FileSpreadsheet } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ReceiptConfig;
  onSave: (newConfig: ReceiptConfig) => void;
  onReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onReset,
}) => {
  const [form, setForm] = useState<ReceiptConfig>(config);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 md:p-8 shadow-2xl my-8 relative text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pengaturan Kuitansi & Integrasi Sheet
            </h3>
            <p className="text-xs text-slate-500">
              Sesuaikan data kop surat, bendahara, dan sumber Google Sheets
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Spreadsheet ID */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
              ID Google Sheets (Aktif)
            </label>
            <input
              type="text"
              value={form.sheetId}
              onChange={(e) => setForm({ ...form, sheetId: e.target.value })}
              placeholder="18hSnNA8eRtdukicAHHqUjtwohEhKVt5uOPy-RdScXTE"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:border-teal-600 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              ID yang ada di antara <span className="font-mono text-teal-700 font-semibold">/d/</span> dan <span className="font-mono text-teal-700 font-semibold">/edit</span> pada URL Google Spreadsheet Anda.
            </p>
          </div>

          {/* Lembaga */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Nama Pesantren / Lembaga
              </label>
              <input
                type="text"
                value={form.institutionName}
                onChange={(e) =>
                  setForm({ ...form, institutionName: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Judul Kuitansi Resmi
              </label>
              <input
                type="text"
                value={form.receiptTitle}
                onChange={(e) =>
                  setForm({ ...form, receiptTitle: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none uppercase"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Alamat Lengkap Kop
            </label>
            <input
              type="text"
              value={form.institutionAddress}
              onChange={(e) =>
                setForm({ ...form, institutionAddress: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Bendahara */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Nama Bendahara (TTD)
              </label>
              <input
                type="text"
                value={form.bendaharaName}
                onChange={(e) =>
                  setForm({ ...form, bendaharaName: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none uppercase font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Jabatan Penandatangan
              </label>
              <input
                type="text"
                value={form.bendaharaTitle}
                onChange={(e) =>
                  setForm({ ...form, bendaharaTitle: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Tujuan Pembayaran */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Teks "Untuk Pembayaran"
            </label>
            <input
              type="text"
              value={form.paymentPurpose}
              onChange={(e) =>
                setForm({ ...form, paymentPurpose: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none uppercase"
            />
          </div>

          {/* Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                <Image className="w-3 h-3 text-teal-600" /> URL Logo Kop
              </label>
              <input
                type="text"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-[11px] focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                <Image className="w-3 h-3 text-teal-600" /> URL Gambar Tanda Tangan
              </label>
              <input
                type="text"
                value={form.ttdUrl}
                onChange={(e) => setForm({ ...form, ttdUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-[11px] focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                onReset();
                onClose();
              }}
              className="px-3 py-2 text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors text-xs font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Standar Ponpes
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-sm shadow-teal-600/20 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Pengaturan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
