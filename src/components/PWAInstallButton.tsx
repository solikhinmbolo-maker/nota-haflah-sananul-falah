import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="px-3.5 sm:px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 border border-teal-500/80 rounded-xl shadow-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95"
        title="Instal aplikasi ke layar utama HP / Desktop"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Instal Aplikasi</span>
        <span className="sm:hidden">Instal</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="px-3.5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 border border-teal-500/80 rounded-xl shadow-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95"
          title="Panduan instal aplikasi di iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Instal iOS</span>
          <span className="sm:hidden">Instal</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-800 relative">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Tutup panduan"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-base font-extrabold text-slate-900">
                Instal di iPhone / iPad
              </h3>
              <p className="mt-2.5 text-xs text-slate-600 leading-relaxed space-y-1.5">
                <span className="block">
                  1. Ketuk tombol <strong>Bagikan (Share)</strong> di bilah Safari bawah/atas.
                </span>
                <span className="block">
                  2. Gulir ke bawah dan pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
                </span>
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-teal-600 hover:bg-teal-700 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
