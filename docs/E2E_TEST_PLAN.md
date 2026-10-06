# E2E test plan — RavaCollect

**Semua skenario berstatus planned / belum dijalankan.** YAML executable dibuat setelah aplikasi dan selector terbukti. Dokumen ini tidak mengklaim pengujian telah lulus.

## Ruang pengujian

Maestro menjalankan perjalanan UI pada aplikasi Android terpasang. Unit memeriksa aturan saldo/harga; integration SQLite memeriksa atomicity, unique ownership, replay, migrasi, dan concurrent write. E2E membuktikan hasil yang terlihat dan persistensi sesudah proses berakhir.

## Fixture dan isolasi

Gunakan `collect-v1` pada TRD: saldo 1.000 kredit, `owned-orbit` sudah dimiliki, Lumen 250, Tide 400, Premium 1.500; watchlist/listing kosong. Ledger awal tepat satu grant. Aset tersedia offline. Tiap skenario independen mulai dari fixture bersih kecuali langkah-langkah di dalam persistence journey.

Beli Lumen: saldo 750; beli Tide berikutnya: 350. Pembelian Lumen hanya menghasilkan satu purchase, debit -250, dan ownership. Publish listing Lumen seharga 300 kredit tidak menambah saldo.

## Matriks Given / When / Then

| ID | Prioritas / requirement | Given | When | Then |
|---|---|---|---|---|
| COL-E01 | P0 / 01–02 | Seed bersih | Cari kreator/karya, filter kategori, urutkan harga, buka Lumen | Hasil sesuai filter/urutan; detail menunjukkan Lumen 250 kredit dan identitas benar. |
| COL-E02 | P0 / 01 | Katalog tersedia | Cari teks tanpa hasil lalu hapus | Empty state tampil; daftar kembali setelah query dihapus. |
| COL-E03 | P0 / 03,09 | Watchlist kosong | Favoritkan Lumen, relaunch, hapus dari watchlist | Tepat satu favorit bertahan; setelah hapus daftar kosong. |
| COL-E04 | P0 / 04–06,08 | Saldo 1.000, Lumen belum dimiliki | Tinjau konfirmasi lalu beli Lumen | Harga 250, saldo akhir 750, karya masuk koleksi, satu aktivitas pembelian. |
| COL-E05 | P0 / 05–06,09 | Lumen sudah dibeli | Coba membeli Lumen lagi dan starter Orbit | Ditolak/sudah dimiliki; saldo, ledger, dan ownership tidak berubah. |
| COL-E06 | P0 / 05,09 | Saldo 1.000, Premium 1.500 | Coba beli Premium | Pesan kredit kurang; tidak ada debit, purchase, atau ownership baru. |
| COL-E07 | P0 / 05 | Saldo 1.000 | Ketuk konfirmasi Lumen cepat dua kali | Satu hasil pembelian dan saldo 750; integration replay operation ID juga menghasilkan satu purchase. |
| COL-E08 | P0 / 05,09 | Fixture + fault write tengah transaksi | Konfirmasi beli; lepaskan fault lalu retry | Sebelum retry saldo 1.000 dan ownership belum ada; sesudah retry saldo 750 dan satu pembelian. |
| COL-E09 | P0 / 04,06,08–09 | Lumen sudah dibeli | Stop/relaunch tanpa clear data | Saldo 750, ownership Lumen, dan aktivitas bertahan konsisten. |
| COL-E10 | P0 / 07 | Starter Orbit dimiliki | Buat draft listing, lihat, edit harga/deskripsi, publish, unpublish, hapus | Semua perubahan tersimpan; saldo tetap 1.000; ownership Orbit tetap ada; aktivitas sesuai aksi. |
| COL-E11 | P0 / 07,09 | Karya tidak dimiliki atau sudah punya listing | Coba membuat listing, harga nol/negatif/pecahan, deskripsi terlalu panjang, dan duplikasi | Input/operasi ditolak; listing dan saldo tidak berubah. |
| COL-E12 | P0 / 07,09 | Listing published milik sendiri | Relaunch, buka listing, hapus dengan konfirmasi | Harga/status bertahan sebelum hapus; sesudah hapus ownership dan riwayat tetap ada. |
| COL-E13 | P0 / 01–09 | Seed lokal | Matikan jaringan, relaunch, cari karya, beli Lumen, buat listing | Gambar dan alur lokal berjalan tanpa request jaringan; hasil sama dengan fixture online. |
| COL-E14 | P0 / 10 | Pembelian dan listing sudah dibuat | Buka reset, batal; lalu konfirmasi dan relaunch | Batal mempertahankan data; konfirmasi memulihkan saldo 1.000, starter saja, listing kosong, satu grant awal. |
| COL-E15 | P0 / 07,09 | Fault write listing/watchlist diaktifkan di build E2E | Simpan perubahan | Error terlihat; tidak ada sukses palsu atau perubahan setelah relaunch. |
| COL-E16 | P1 / 11 | Layar kecil/besar, font scale 1.3 | Navigasi, Android Back, keyboard form, review TalkBack | Kontrol/label/fokus dapat digunakan; satuan kredit demo selalu jelas; tidak ada pemotongan kritis. |

Tambahkan integration concurrency: jalankan pembelian 700 dan 600 kredit bersamaan dengan saldo 1.000. Tepat satu berhasil; saldo akhir sesuai pembelian yang berhasil dan tidak negatif. Nilai tersebut adalah fixture khusus integration, bukan perubahan harga katalog UI.

## Selector dan bukti

Usulan testID: `discovery.search`, `artwork.<id>`, `purchase.confirm`, `credits.balance`, `collection.item.<id>`, `listing.price`, `listing.publish`, `settings.reset`. Verifikasi terhadap hierarchy Android sebelum menulis selector flow; tidak mengandalkan koordinat absolut.

Catat case/requirement ID, source commit/hash, APK hash, app ID, fixture version, runner version, device/emulator/API, command, timestamp, log, screenshot checkpoints, serta status pass/fail/blocked. Fault test harus memakai repository yang sama dengan release. Bukti UI tidak menggantikan integration proof atomicity.

## Gate

Semua P0 lulus tanpa retry yang menyembunyikan kegagalan. Core journey dijalankan lagi pada APK release tanpa hook E2E. P1/manual TalkBack dan cakupan perangkat dicatat secara terpisah; iOS/perangkat fisik tetap unverified sampai benar-benar diuji.

Referensi runner: [React Native](https://docs.maestro.dev/get-started/supported-platform/react-native), [CLI](https://docs.maestro.dev/maestro-cli/maestro-cli-commands-and-options).
