/**
 * Konversi angka rupiah ke kalimat terbilang Bahasa Indonesia
 * Contoh: 1000000 -> "SATU JUTA RUPIAH"
 */
export function angkaTerbilang(angka: number): string {
  if (isNaN(angka) || angka <= 0) return 'NOL RUPIAH';

  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  function konversi(n: number): string {
    const bagi = (a: number, b: number) => Math.floor(a / b);

    if (n < 12) {
      return bilangan[n];
    }
    if (n < 20) {
      return konversi(n - 10) + ' Belas';
    }
    if (n < 100) {
      const sisa = n % 10;
      return (
        konversi(bagi(n, 10)) +
        ' Puluh' +
        (sisa > 0 ? ' ' + konversi(sisa) : '')
      );
    }
    if (n < 200) {
      const sisa = n - 100;
      return 'Seratus' + (sisa > 0 ? ' ' + konversi(sisa) : '');
    }
    if (n < 1000) {
      const sisa = n % 100;
      return (
        konversi(bagi(n, 100)) +
        ' Ratus' +
        (sisa > 0 ? ' ' + konversi(sisa) : '')
      );
    }
    if (n < 2000) {
      const sisa = n - 1000;
      return 'Seribu' + (sisa > 0 ? ' ' + konversi(sisa) : '');
    }
    if (n < 1000000) {
      const sisa = n % 1000;
      return (
        konversi(bagi(n, 1000)) +
        ' Ribu' +
        (sisa > 0 ? ' ' + konversi(sisa) : '')
      );
    }
    if (n < 1000000000) {
      const sisa = n % 1000000;
      return (
        konversi(bagi(n, 1000000)) +
        ' Juta' +
        (sisa > 0 ? ' ' + konversi(sisa) : '')
      );
    }
    if (n < 1000000000000) {
      const sisa = n % 1000000000;
      return (
        konversi(bagi(n, 1000000000)) +
        ' Miliar' +
        (sisa > 0 ? ' ' + konversi(sisa) : '')
      );
    }
    return '';
  }

  const hasil = konversi(Math.floor(angka)).trim();
  return (hasil ? hasil + ' RUPIAH' : 'NOL RUPIAH').toUpperCase();
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace('Rp', 'Rp ') + ',-';
}

export function formatRupiahNumberOnly(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
