/* Menu admin dipakai bersama oleh sidebar (AdminLayout) dan kartu
   Ringkasan (Overview). Route anak di App.js dibangun dari daftar ini. */
export const ADMIN_MENU = [
  { slug: 'hero', icon: '🎬', label: 'Beranda', hint: 'Atur judul utama dan teks pengantar portfolio.', cta: 'Kelola hero' },
  { slug: 'story', icon: '📝', label: 'In Perspective', hint: 'Perbarui cerita personal dan informasi connect.', cta: 'Kelola narasi' },
  { slug: 'fragments', icon: '🖼️', label: 'Fragments', hint: 'Kelola dokumentasi, galeri, dan fragments visual.', cta: 'Kelola fragments' },
  { slug: 'journal', icon: '📚', label: 'Journal & tulisan', hint: 'Terbitkan jurnal, kutipan, esai, dan cerita panjang.', cta: 'Buka ruang tulis' },
  { slug: 'writing', icon: '🪶', label: 'Asisten Karya Tulis', hint: 'Tulis bebas tanpa batas karakter, lalu diskusikan naskah bersama AI.', cta: 'Buka asisten', featured: true },
  { slug: 'media', icon: '🎨', label: 'Pustaka media', hint: 'Atur aset visual yang telah diunggah.', cta: 'Kelola media' },
  { slug: 'novel', icon: '📖', label: 'Koleksi novel', hint: 'Kelola novel resmi dan detail pesanannya.', cta: 'Kelola novel' },
  { slug: 'messages', icon: '📧', label: 'Pesan pengunjung', hint: 'Lihat, hapus, dan ekspor pesan yang dikirim pengunjung.', cta: 'Lihat pesan' },
];
