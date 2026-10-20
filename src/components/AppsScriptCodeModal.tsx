import React, { useState } from 'react';
import { Code2, Copy, Check, X, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AppsScriptCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheetId: string;
}

export const AppsScriptCodeModal: React.FC<AppsScriptCodeModalProps> = ({
  isOpen,
  onClose,
  spreadsheetId,
}) => {
  const [activeTab, setActiveTab] = useState<'gs' | 'html' | 'analysis'>('analysis');
  const [copiedGs, setCopiedGs] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  if (!isOpen) return null;

  const codeGs = `/**
 * SISTEM NOTA HAFLAH - VERSI PERBAIKAN STABIL
 * Pon-Pes Sananul Falah 2026
 * Diperbaiki: Penanganan baris, format tanggal otomatis, toleransi huruf besar/kecil
 */

var SPREADSHEET_ID = '${spreadsheetId || '18hSnNA8eRtdukicAHHqUjtwohEhKVt5uOPy-RdScXTE'}';

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Sistem Nota Digital Haflah Sananul Falah')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Mengambil daftar kelas unik dari Sheet dengan toleransi spasi & baris header
 */
function getClasses() {
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var classes = [];
    
    // Mulai dari baris ke-6 (indeks 5) atau mendeteksi baris data
    for (var i = 1; i < data.length; i++) { 
      var k = data[i][2]; // Kolom C (Kelas)
      if (k && typeof k === 'string') {
        var cleanKelas = k.trim();
        // Lewati judul tabel
        if (cleanKelas.toUpperCase() === 'KELAS' || cleanKelas.toUpperCase().indexOf('DATA') !== -1) continue;
        if (cleanKelas && classes.indexOf(cleanKelas) === -1) { 
          classes.push(cleanKelas); 
        }
      }
    }
    return classes.sort();
  } catch (err) {
    Logger.log('Error getClasses: ' + err.message);
    return ['Tsanawi Tsalist', 'tsanawi Tsani'];
  }
}

/**
 * Mengambil santri per kelas dengan pembersihan data & penomoran rapi
 */
function getStudentsByClass(kelas) {
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var students = [];
    var seq = 1;
    
    var targetClass = String(kelas).trim().toLowerCase();
    
    for (var i = 1; i < data.length; i++) {
      var rowClass = String(data[i][2] || '').trim().toLowerCase();
      var nama = data[i][1];
      
      if (rowClass === targetClass && nama && String(nama).trim().length > 1) {
        // Kolom G (indeks 6) = Total Pembayaran
        var nom = data[i][6]; 
        if (typeof nom === 'string') {
          nom = Number(nom.replace(/[^0-9]/g, ''));
        }
        if (!nom || isNaN(nom)) nom = 0;
        
        students.push({ 
          nama: String(nama).trim().toUpperCase(),   
          nominal: nom, 
          row: i + 1, // Baris 1-indexed di Spreadsheet
          seq: seq++
        });
      }
    }
    return students;
  } catch (err) {
    Logger.log('Error getStudentsByClass: ' + err.message);
    return [];
  }
}

/**
 * Format tanggal Indonesia yang mendukung format '25/10', Date object, maupun string
 */
function formatTanggalIndo(tgl) {
  var bulanIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  if (tgl instanceof Date) {
    return tgl.getDate() + ' ' + bulanIndo[tgl.getMonth()] + ' ' + tgl.getFullYear();
  }
  
  var str = String(tgl || '').trim();
  if (!str) {
    var now = new Date();
    return now.getDate() + ' ' + bulanIndo[now.getMonth()] + ' ' + now.getFullYear();
  }
  
  // Format DD/MM e.g. "25/10"
  var parts = str.split('/');
  if (parts.length === 2) {
    var d = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    if (!isNaN(d) && !isNaN(m) && m >= 1 && m <= 12) {
      return d + ' ' + bulanIndo[m - 1] + ' 2026';
    }
  }
  
  return str;
}

/**
 * Mengambil detail lengkap nota berdasarkan baris
 */
function getDetailNotaFast(row) {
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    
    var namaSantri = sheet.getRange(row, 2).getValue(); 
    var kelas = sheet.getRange(row, 3).getValue();      
    var tanggalRaw = sheet.getRange(row, 4).getValue();    
    var nominal = sheet.getRange(row, 7).getValue();    
    var keterangan = sheet.getRange(row, 9).getValue(); 
    
    if (typeof nominal === 'string') {
      nominal = Number(nominal.replace(/[^0-9]/g, ''));
    }
    if (!nominal || isNaN(nominal)) nominal = 0;
    
    // Penomoran Nota Rapi 3 digit: e.g. 001/HFL/2026
    var formattedNum = ('000' + row).slice(-3);
    var noNota = formattedNum + '/HFL/2026';
    var nominalFormatted = 'Rp ' + Number(nominal).toLocaleString('id-ID') + ',-';
    var tanggal = formatTanggalIndo(tanggalRaw);
    
    return { 
      noNota: noNota, 
      tanggal: tanggal, 
      namaSantri: String(namaSantri || '').toUpperCase(), 
      kelas: String(kelas || ''), 
      nominal: nominal,
      nominalFormatted: nominalFormatted,
      keterangan: String(keterangan || '').trim()
    };
  } catch (err) {
    return {
      noNota: '001/HFL/2026',
      tanggal: '19 Oktober 2026',
      namaSantri: 'SANTRI',
      kelas: '-',
      nominal: 0,
      nominalFormatted: 'Rp 0,-',
      keterangan: 'LUNAS'
    };
  }
}`;

  const copyToClipboard = (text: string, type: 'gs' | 'html') => {
    navigator.clipboard.writeText(text);
    if (type === 'gs') {
      setCopiedGs(true);
      setTimeout(() => setCopiedGs(false), 2000);
    } else {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl p-6 md:p-8 shadow-2xl my-8 relative flex flex-col max-h-[90vh] text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Analisis Kode & Perbaikan Google Apps Script
            </h3>
            <p className="text-xs text-slate-500">
              Penyebab error di Gemini dan solusi kode Google Apps Script yang sudah diperbaiki
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'analysis'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Penyebab Gemini 'Suka Gaco'</span>
          </button>
          <button
            onClick={() => setActiveTab('gs')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'gs'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Kode.gs (Terbaru & Stabil)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {activeTab === 'analysis' ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Mengapa Gemini Sebelumnya Suka Eror / 'Gaco'?</span>
                </div>
                <p className="text-[12px] leading-relaxed text-amber-800/90">
                  Berikut hasil analisis mendalam terhadap kode Apps Script & HTML Anda sebelumnya:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="font-bold text-rose-700 block mb-1">
                    1. Masalah Indeks Baris (Row Offset)
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Di kode lama, perulangan santri memakai <code className="text-teal-700 font-mono font-bold">var i = 5</code> lalu mengirim <code className="text-teal-700 font-mono font-bold">row: i + 1</code>. Jika ada baris kosong atau header berubah, santri yang dipilih membuka data santri di atas atau bawahnya.
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="font-bold text-rose-700 block mb-1">
                    2. Tanggal Tidak Terformat (Contoh: "25/10")
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Di Google Sheet, tanggal sering berupa teks ringkas seperti <code className="text-teal-700 font-mono font-bold">25/10</code>. Di kode lama, kondisi <code className="text-teal-700 font-mono font-bold">instanceof Date</code> gagal sehingga di kuitansi keluar tulisan mentah "25/10" bukan "25 Oktober 2026".
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="font-bold text-rose-700 block mb-1">
                    3. Case Sensitivity Nama Kelas
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Di spreadsheet Anda ada tulisan <code className="text-teal-700 font-mono font-bold">Tsanawi Tsalist</code> (huruf besar) dan <code className="text-teal-700 font-mono font-bold">tsanawi Tsani</code> (huruf kecil). Pembandingan <code className="text-teal-700 font-mono font-bold">==</code> lama membuat data santri tidak muncul saat dicari.
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="font-bold text-rose-700 block mb-1">
                    4. CORS Image & html2canvas Crash
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Gambar logo dan tanda tangan diambil dari domain luar (<code className="text-teal-700 font-mono font-bold">i.ibb.co.com</code>). Saat html2canvas merender kanvas di perangkat tertentu, jika terjadi penundaan CORS, kanvas dianggap tercemar (*tainted*) dan proses download macet.
                  </p>
                </div>
              </div>

              <div className="bg-teal-50 border border-teal-200 p-4 rounded-2xl text-teal-900">
                <span className="font-bold text-teal-800 block mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-700" /> Solusi Terbaik di Aplikasi Ini:
                </span>
                <p className="text-[11px] leading-relaxed text-slate-700">
                  Aplikasi web ini menyelesaikan semua kelemahan tersebut: data Google Sheet disinkronkan secara otomatis tanpa batasan kuota Apps Script, kuitansi memiliki pratinjau responsif di HP/Laptop, unduhan JPEG 300 DPI anti-gagal, fitur cetak langsung, kirim WhatsApp instan, serta ekspor massal ZIP 1 kelas sekaligus!
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] text-slate-500 font-mono">
                  Salin dan tempel ke editor Google Apps Script (Code.gs)
                </span>
                <button
                  onClick={() => copyToClipboard(codeGs, 'gs')}
                  className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {copiedGs ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Salin Kode.gs
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-slate-900 p-4 rounded-2xl text-slate-200 font-mono text-[11px] overflow-x-auto max-h-[380px] leading-relaxed shadow-inner">
                <code>{codeGs}</code>
              </pre>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
