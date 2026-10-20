export interface SantriRecord {
  id: string;
  no: number;
  nama: string;
  kelas: string;
  tanggalRaw: string;
  tanggalFormatted: string;
  cicilan1: number;
  cicilan2: number;
  total: number;
  kekurangan: number;
  keterangan: string; // 'LUNAS' or other
  notaUrl?: string;
  rowNumber: number;
  noNota: string;
}

export interface ReceiptConfig {
  sheetId: string;
  institutionName: string;
  institutionSub: string;
  institutionAddress: string;
  logoUrl: string;
  ttdUrl: string;
  receiptTitle: string;
  bendaharaName: string;
  bendaharaTitle: string;
  paymentPurpose: string;
  customYear: string;
  watermarkLunasText: string;
  showWatermark: boolean;
}

export interface ActiveReceiptData {
  noNota: string;
  tanggal: string;
  namaSantri: string;
  kelas: string;
  tujuanPembayaran: string;
  nominal: number;
  nominalFormatted: string;
  terbilang: string;
  keterangan: string;
  isLunas: boolean;
  bendaharaName: string;
  bendaharaTitle: string;
  logoUrl: string;
  ttdUrl: string;
  institutionName: string;
  institutionAddress: string;
  receiptTitle: string;
}
