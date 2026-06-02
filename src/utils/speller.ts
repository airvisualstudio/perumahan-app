/**
 * Convert numeric value into spelled-out Indonesian text
 * e.g., 1500000 -> "Satu Juta Lima Ratus Ribu Rupiah"
 */
export function terbilang(nominal: number): string {
  const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  
  if (nominal < 0) {
    return 'Minus ' + terbilang(Math.abs(nominal));
  }
  
  let temp = '';
  const val = Math.floor(nominal);
  
  if (val < 12) {
    temp = ' ' + units[val];
  } else if (val < 20) {
    temp = terbilang(val - 10) + ' Belas';
  } else if (val < 100) {
    temp = terbilang(Math.floor(val / 10)) + ' Puluh' + terbilang(val % 10);
  } else if (val < 200) {
    temp = ' Seratus' + terbilang(val - 100);
  } else if (val < 1000) {
    temp = terbilang(Math.floor(val / 100)) + ' Ratus' + terbilang(val % 100);
  } else if (val < 2000) {
    temp = ' Seribu' + terbilang(val - 1000);
  } else if (val < 1000000) {
    temp = terbilang(Math.floor(val / 1000)) + ' Ribu' + terbilang(val % 1000);
  } else if (val < 1000000000) {
    temp = terbilang(Math.floor(val / 1000000)) + ' Juta' + terbilang(val % 1000000);
  } else if (val < 1000000000000) {
    temp = terbilang(Math.floor(val / 1000000000)) + ' Milyar' + terbilang(val % 1000000000);
  } else if (val < 1000000000000000) {
    temp = terbilang(Math.floor(val / 1000000000000)) + ' Triliun' + terbilang(val % 1000000000000);
  }
  
  return temp.replace(/\s+/g, ' ').trim() + ' Rupiah';
}

/**
 * Format number to standard Indonesian Rupiah currency format
 * e.g., 1500000 -> "Rp 1.500.000,00"
 */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}
