import { SantriRecord } from '../types';

export const DEFAULT_SPREADSHEET_ID = '18hSnNA8eRtdukicAHHqUjtwohEhKVt5uOPy-RdScXTE';

// Bulan Indonesia
const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function formatIndonesianDate(rawDate: string | Date | undefined): string {
  if (!rawDate) {
    const now = new Date();
    return `${now.getDate()} ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  }

  if (rawDate instanceof Date) {
    return `${rawDate.getDate()} ${MONTH_NAMES[rawDate.getMonth()]} ${rawDate.getFullYear()}`;
  }

  const str = String(rawDate).trim();
  if (!str) {
    const now = new Date();
    return `${now.getDate()} ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  }

  // Handle format DD/MM e.g. "25/10"
  const slashParts = str.split('/');
  if (slashParts.length === 2) {
    const d = parseInt(slashParts[0], 10);
    const m = parseInt(slashParts[1], 10);
    if (!isNaN(d) && !isNaN(m) && m >= 1 && m <= 12) {
      return `${d} ${MONTH_NAMES[m - 1]} 2026`;
    }
  }

  // Handle format DD/MM/YYYY
  if (slashParts.length === 3) {
    const d = parseInt(slashParts[0], 10);
    const m = parseInt(slashParts[1], 10);
    const y = parseInt(slashParts[2], 10);
    if (!isNaN(d) && !isNaN(m) && m >= 1 && m <= 12) {
      return `${d} ${MONTH_NAMES[m - 1]} ${y < 100 ? 2000 + y : y}`;
    }
  }

  // Check if standard Date.parse works
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return `${parsed.getDate()} ${MONTH_NAMES[parsed.getMonth()]} ${parsed.getFullYear()}`;
  }

  return str;
}

/**
 * Ekstrak 4 digit tanggal dan bulan (DDMM)
 * Contoh: "27/10" -> "2710", "27 Oktober 2026" -> "2710", "5/8" -> "0508"
 */
export function extractDDMM(
  rawDate: string | Date | undefined,
  formattedDate?: string
): string {
  if (rawDate instanceof Date) {
    const d = String(rawDate.getDate()).padStart(2, '0');
    const m = String(rawDate.getMonth() + 1).padStart(2, '0');
    return `${d}${m}`;
  }

  const str = String(rawDate || '').trim();
  if (str) {
    // Format "27/10", "27-10", "27/10/2026", "27-10-2026"
    const parts = str.split(/[/.-]/);
    if (parts.length >= 2) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(d) && !isNaN(m) && d >= 1 && d <= 31 && m >= 1 && m <= 12) {
        return `${String(d).padStart(2, '0')}${String(m).padStart(2, '0')}`;
      }
    }
  }

  // Cek jika terdapat teks nama bulan bahasa Indonesia
  const refStr = formattedDate || str;
  if (refStr) {
    const monthIndexMap: Record<string, string> = {
      januari: '01',
      februari: '02',
      maret: '03',
      april: '04',
      mei: '05',
      juni: '06',
      juli: '07',
      agustus: '08',
      september: '09',
      oktober: '10',
      november: '11',
      desember: '12',
    };
    const match = refStr.match(/(\d{1,2})\s+([a-zA-Z]+)/);
    if (match) {
      const d = parseInt(match[1], 10);
      const mKey = match[2].toLowerCase();
      const m = monthIndexMap[mKey];
      if (!isNaN(d) && m) {
        return `${String(d).padStart(2, '0')}${m}`;
      }
    }
  }

  // Fallback: tanggal hari ini DDMM
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${d}${m}`;
}

/**
 * Format No. Kuitansi Otomatis:
 * "Nomor urut santri/tanggal, bulan pembayaran/HAFLAH/tahun"
 * Contoh: "003/2710/HFLH/2026"
 */
export function generateNoNota(
  no: number,
  rawDate: string | Date | undefined,
  formattedDate?: string,
  year: string = '2026'
): string {
  const paddedNo = String(no).padStart(3, '0');
  const ddmm = extractDDMM(rawDate, formattedDate);
  return `${paddedNo}/${ddmm}/HFLH/${year}`;
}

export function parseRupiahNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// Robust CSV parser handling quoted multi-line fields
export function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip LF
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export async function fetchSheetData(spreadsheetId: string = DEFAULT_SPREADSHEET_ID): Promise<SantriRecord[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Gagal memuat Google Sheets (Status: ${res.status})`);
    }
    const csv = await res.text();
    return parseSantriRecordsFromCSV(csv);
  } catch (error) {
    console.warn('Menggunakan fallback data karena:', error);
    return getFallbackData();
  }
}

export function parseSantriRecordsFromCSV(csvText: string): SantriRecord[] {
  const rows = parseCSV(csvText);
  const records: SantriRecord[] = [];
  let sequentialNumber = 1;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (row.length < 3) continue;

    // Detect header row or metadata rows
    const col0 = (row[0] || '').trim();
    const col1 = (row[1] || '').trim();
    const col2 = (row[2] || '').trim();

    // Skip title row like "DATA PEMBAYARAN HAFLAH..." or headers like "NAMA", "KELAS"
    if (
      col0.toUpperCase().includes('DATA PEMBAYARAN') ||
      col1.toUpperCase() === 'NAMA' ||
      col2.toUpperCase() === 'KELAS' ||
      (!col1 && !col2)
    ) {
      continue;
    }

    const nama = col1;
    if (!nama || nama.length < 2) continue;

    const kelas = col2;
    const tanggalRaw = row[3] || '';
    const cicilan1 = parseRupiahNumber(row[4]);
    const cicilan2 = parseRupiahNumber(row[5]);
    let total = parseRupiahNumber(row[6]);
    if (total === 0 && (cicilan1 > 0 || cicilan2 > 0)) {
      total = cicilan1 + cicilan2;
    }
    const kekurangan = parseRupiahNumber(row[7]);
    const keteranganRaw = (row[8] || '').trim();
    const notaUrl = (row[9] || '').trim();

    // Gunakan nomor urut dari kolom NO jika ada, atau nomor urut sekuensial
    const parsedCol0 = parseInt(col0, 10);
    const santriNo = !isNaN(parsedCol0) && parsedCol0 > 0 ? parsedCol0 : sequentialNumber;

    const tanggalFormatted = formatIndonesianDate(tanggalRaw);
    // Format otomatis: "003/2710/HFLH/2026"
    const noNota = generateNoNota(santriNo, tanggalRaw, tanggalFormatted, '2026');

    records.push({
      id: `santri-${r}-${sequentialNumber}`,
      no: santriNo,
      nama: nama.toUpperCase(),
      kelas: kelas.trim(),
      tanggalRaw: tanggalRaw,
      tanggalFormatted,
      cicilan1,
      cicilan2,
      total,
      kekurangan,
      keterangan: keteranganRaw.toUpperCase().includes('LUNAS')
        ? 'LUNAS'
        : total > 0 && kekurangan === 0
        ? 'LUNAS'
        : keteranganRaw || (total > 0 ? 'LUNAS' : 'BELUM BAYAR'),
      notaUrl,
      rowNumber: r + 1,
      noNota,
    });

    sequentialNumber++;
  }

  return records.length > 0 ? records : getFallbackData();
}

export function getFallbackData(): SantriRecord[] {
  const rawList = [
    { nama: 'MIFTAHUDIN', kelas: 'Tsanawi Tsalist', tgl: '25/10', total: 1000000, ket: 'LUNAS' },
    { nama: 'M. FIRMANSYAH', kelas: 'Tsanawi Tsalist', tgl: '26/10', total: 1000000, ket: 'LUNAS' },
    { nama: 'M. NASRULLAH', kelas: 'Tsanawi Tsalist', tgl: '27/10', total: 1000000, ket: 'LUNAS' },
    { nama: 'M. RIFQI HIDAYAT', kelas: 'Tsanawi Tsalist', tgl: '28/10', total: 1000000, ket: 'LUNAS' },
    { nama: 'NOVIAN ARDAN', kelas: 'Tsanawi Tsalist', tgl: '29/10', total: 1000000, ket: 'LUNAS' },
    { nama: "LATIFATUL 'ALIYA", kelas: 'Tsanawi Tsalist', tgl: '30/10', total: 1000000, ket: 'LUNAS' },
    { nama: 'IRHAM MUBARAK', kelas: 'Tsanawi Tsalist', tgl: '', total: 0, ket: 'BELUM BAYAR' },
    { nama: 'RAHMA ANATASYA', kelas: 'Tsanawi Tsalist', tgl: '', total: 0, ket: 'BELUM BAYAR' },
    { nama: 'TAZKIA MELIANA', kelas: 'Tsanawi Tsalist', tgl: '', total: 0, ket: 'BELUM BAYAR' },
    { nama: 'ILHAMUDDIN', kelas: 'Tsanawi Tsalist', tgl: '', total: 0, ket: 'BELUM BAYAR' },
    { nama: "M. ZA'FARONI AJIZ", kelas: 'Tsanawi Tsalist', tgl: '', total: 0, ket: 'BELUM BAYAR' },
    { nama: 'SILLA ULFATUN .N', kelas: 'Tsanawi Tsalist', tgl: '', total: 0, ket: 'BELUM BAYAR' },
    { nama: 'ALIYA ALMAGHFIRA .L', kelas: 'Tsanawi Tsalist', tgl: '', total: 0, ket: 'BELUM BAYAR' },
    { nama: 'MUHAIMIN MAKSUM', kelas: 'Tsanawi Tsani', tgl: '24/10', total: 1000000, ket: 'LUNAS' },
    { nama: 'AKHMAD DHIHA HULHAQ', kelas: 'Tsanawi Tsani', tgl: '25/10', total: 1000000, ket: 'LUNAS' },
    { nama: 'ANWARUL FATA', kelas: 'Tsanawi Tsani', tgl: '', total: 0, ket: 'BELUM BAYAR' },
    { nama: 'FARID MUZAQI', kelas: 'Tsanawi Tsani', tgl: '26/10', total: 500000, ket: 'CICILAN' },
    { nama: 'ARIS FIRMANSYAH', kelas: 'Tsanawi Tsani', tgl: '27/10', total: 1000000, ket: 'LUNAS' },
    { nama: 'RAHMA RRAFI SURYADI', kelas: 'Tsanawi Tsani', tgl: '', total: 0, ket: 'BELUM BAYAR' },
    { nama: 'IQBAL REYHAN SYACHREZA', kelas: 'Tsanawi Tsani', tgl: '28/10', total: 1000000, ket: 'LUNAS' },
    { nama: 'M. NAJMA RAMADHAN', kelas: 'Tsanawi Tsani', tgl: '', total: 0, ket: 'BELUM BAYAR' },
    { nama: 'YUSUF INDRA GUNAWAN', kelas: 'Tsanawi Tsani', tgl: '29/10', total: 1000000, ket: 'LUNAS' },
    { nama: 'MUHAMMAD ALUNG SETIAWAN', kelas: 'Tsanawi Tsani', tgl: '', total: 0, ket: 'BELUM BAYAR' },
    { nama: 'ALIF RAMADHAN IRFANDI', kelas: 'Tsanawi Tsani', tgl: '', total: 0, ket: 'BELUM BAYAR' },
    { nama: 'ANAS SHOFATUL KAHFI', kelas: 'Tsanawi Tsani', tgl: '30/10', total: 1000000, ket: 'LUNAS' },
    { nama: 'FAHMI IDRIS', kelas: 'Tsanawi Tsani', tgl: '', total: 0, ket: 'BELUM BAYAR' },
    { nama: 'IRMA LAILATUL CAHYANI', kelas: 'Tsanawi Tsani', tgl: '31/10', total: 1000000, ket: 'LUNAS' },
    { nama: 'SELVIA ROYFATHUL NISA', kelas: 'Tsanawi Tsani', tgl: '', total: 0, ket: 'BELUM BAYAR' },
    { nama: 'SHOFIATUL HIDAYAH', kelas: 'Tsanawi Tsani', tgl: '', total: 0, ket: 'BELUM BAYAR' },
  ];

  return rawList.map((item, index) => {
    const num = index + 1;
    const tanggalFormatted = formatIndonesianDate(item.tgl);
    // Format otomatis: "003/2710/HFLH/2026"
    const noNota = generateNoNota(num, item.tgl, tanggalFormatted, '2026');

    return {
      id: `fallback-${num}`,
      no: num,
      nama: item.nama,
      kelas: item.kelas,
      tanggalRaw: item.tgl,
      tanggalFormatted,
      cicilan1: item.total,
      cicilan2: 0,
      total: item.total,
      kekurangan: item.total >= 1000000 ? 0 : 1000000 - item.total,
      keterangan: item.ket,
      notaUrl: '',
      rowNumber: index + 6,
      noNota,
    };
  });
}
