# PRD — RavaCollect

Tanggal: 2026-10-05. Versi: 0.1. Status: implementasi awal tersedia; verifikasi perangkat dan rilis mengikuti evidence di VERIFICATION.md.

## Tujuan dan pengguna

Mendemonstrasikan pengalaman mobile untuk discovery, detail karya, koleksi pribadi, dan aktivitas marketplace melalui simulasi lokal. Pengguna dapat menyelesaikan alur mengoleksi karya tanpa menghubungkan wallet atau memahami blockchain.

Keberhasilan MVP: discovery -> pembelian simulasi -> koleksi -> listing dapat dicoba, bertahan setelah restart, dan dibuktikan lewat E2E. Proyek tidak mengklaim kepemilikan on-chain atau transaksi finansial nyata.

## Lingkup MVP

| ID | Kemampuan | Kriteria penerimaan |
|---|---|---|
| COL-01 | Discovery | Katalog contoh, cari nama karya/kreator, filter kategori, urutkan harga kredit; empty state yang jelas. |
| COL-02 | Detail karya | Gambar, judul, kreator dummy, kategori, deskripsi, harga kredit, dan status koleksi konsisten. |
| COL-03 | Watchlist | Tambah/hapus favorit tanpa duplikasi; bertahan setelah relaunch. |
| COL-04 | Kredit demo | Saldo awal dan ledger aktivitas terlihat; perubahan saldo hanya berasal dari event demo yang committed. |
| COL-05 | Pembelian simulasi | Konfirmasi menampilkan harga dan saldo tersisa. Pembelian mengurangi kredit, menambah ownership, dan menulis aktivitas secara atomik tepat sekali. |
| COL-06 | Koleksi pribadi | Karya yang dimiliki muncul setelah pembelian dan relaunch; pembelian karya yang sama atau milik sendiri ditolak. |
| COL-07 | Listing lokal | Buat, baca, ubah harga/deskripsi, publish/unpublish, dan hapus listing milik sendiri; satu listing per karya; tidak berpura-pura ada pembeli lain. |
| COL-08 | Aktivitas | Riwayat menampilkan pembelian dan perubahan listing dengan waktu serta status; event tersimpan tidak dapat diedit dari UI. |
| COL-09 | Persistensi/kegagalan | Data bertahan setelah proses ditutup; gagal write atau kredit tidak cukup tidak mengubah saldo/ownership dan tidak menampilkan sukses. |
| COL-10 | Reset demo | Konfirmasi wajib; batal mempertahankan state; setuju mengembalikan saldo, katalog, koleksi awal, dan aktivitas fixture. |
| COL-11 | Usability | Navigasi, keyboard, font besar, TalkBack, dan layar kecil/besar diperiksa. Status simulasi serta satuan kredit terlihat jelas. |

## Perjalanan utama

1. Jelajahi karya dan baca detail; simpan pilihan ke watchlist.
2. Tinjau pembelian dengan kredit demo, konfirmasi, lalu lihat karya pada koleksi pribadi.
3. Buka koleksi, buat listing dengan harga kredit, publish secara lokal, edit atau hapus jika diperlukan.
4. Tinjau aktivitas, tutup/buka aplikasi, dan pastikan saldo serta koleksi tetap konsisten.

## Aturan produk

- Saldo awal 1.000 kredit demo. Harga integer positif. Tidak ada top-up, penarikan, konversi mata uang, atau perubahan harga pasar otomatis.
- Saldo tidak boleh negatif. Harga beli dibaca ulang saat commit.
- Menambahkan listing tidak mengubah saldo atau menghapus ownership. Menghapus listing juga tidak menghapus karya.
- Published berarti terlihat sebagai listing simulasi di aplikasi lokal ini. Tidak ada matching engine atau transaksi dengan orang lain.
- Riwayat mencerminkan event yang benar-benar dilakukan di perangkat; tidak membuat keuntungan, penjualan, atau testimoni palsu.

## Di luar MVP

WalletConnect, private key/seed phrase, minting, smart contract, transaksi blockchain/testnet, lelang, bidding, jaringan pengguna, backend, transfer koleksi, top-up, dan penarikan. Tahap berikutnya hanya dipilih setelah v1 teruji.

## Desain

Tinjau visual referensi sebelum menentukan palet dan komponen. Gunakan aset original atau berlisensi dengan sumber tercatat. Lengkapi empty state, kredit kurang, karya sudah dimiliki, konfirmasi pembelian, dan error penyimpanan yang belum tentu ditampilkan pada Dribbble.

Rancangan original dan keputusan detail dicatat di [DESIGN.md](DESIGN.md). Referensi belum dapat diakses; palet implementasi tidak diklaim berasal dari referensi tersebut.

Traceability requirement dan skenario terdapat di [E2E test plan](E2E_TEST_PLAN.md).
