# Verifikasi RavaCollect

Tanggal: 2026-10-05–06. Status keseluruhan: **partial; belum layak diklaim rilis terverifikasi**.

## Lingkungan

Windows, Node 22.13.0, npm 11.8.0, JDK 17.0.12. Maestro 2.6.1. Perangkat terdeteksi Samsung SM-A125F, Android API 31, ABI arm64-v8a, serial RR8R20BRP4P. Deteksi perangkat bukan bukti aplikasi berjalan.

Repository Git baru diinisialisasi dan belum memiliki commit; tidak ada commit/push/publikasi pada sesi ini. Dependency lengkap terkunci di package-lock.json. Fixture `collect-v1`.

## Bukti yang sudah diperoleh

| Check | Hasil | Batas bukti |
|---|---|---|
| `npm install` | Exit 0 | Dependency terpasang; tidak membuktikan native build |
| `npm run typecheck` | Exit 0 | TypeScript strict |
| `npm run lint` | Exit 0, tanpa warning pada run setelah pemindahan style | Static lint |
| `npm run test:integration` | 19/19 pass, exit 0 | SQLite nyata di Node; tidak menggantikan binding Android |
| `npm test` | 5/5 pass, exit 0 | Harga konfirmasi, double-submit, retry storage, validasi listing, batal/konfirmasi reset |
| `assembleE2e` arm64-v8a awal | FAIL: placeholder manifest `usesCleartextTraffic` tidak tersedia pada variant custom | Diperbaiki melalui defaultConfig=false; build ulang sedang dilakukan |
| `assembleE2e` arm64-v8a kedua | FAIL: Ninja `build.ninja still dirty after 100 tries` | Dry-run Ninja menyebut prefab ConfigVersion tidak ditemukan pada path panjang; output native dipindah ke cache pendek khusus checkout |
| `:app:verifyBundleEntries` bersama assembleE2e/assembleRelease | PASS untuk kedua entry | Mapping task sudah benar; source map APK diperiksa setelah bundling selesai |
| ARM64 `assembleE2e assembleRelease` | PASS, exit 0, 39m34s | Kedua APK terbentuk; log `artifacts/build-arm64-success.log` |
| `node scripts/verify-bundles.mjs` | PASS | E2E 872 source/2 E2E-only; release 871 source/0 E2E-only |
| Maestro purchase/persistence | PASS, 1/1 flow | Samsung A12: konfirmasi 250, double tap, saldo 750, Lumen bertahan setelah stop/relaunch |
| Maestro listing lifecycle, run awal | FAIL (ERROR) | Langkah tes menghapus teks dari tengah kolom harga; cacat skrip tes, langkah diperbaiki |
| Maestro listing lifecycle, run ulang | PASS, 1/1 flow | Harga nol ditolak, edit, publish/unpublish, persistensi, batal hapus, hapus tanpa mengubah saldo/kepemilikan |
| Maestro discovery/favorit/kredit kurang | PASS, 1/1 flow | Pencarian, empty state, filter, urutan harga, favorit setelah relaunch, kredit tidak cukup |
| Maestro rollback pembelian/retry/reset | PASS, 1/1 flow, 2m 28s | Fault pembelian: pesan gagal, saldo tetap 1.000; retry → 750; batal reset mempertahankan saldo/listing; reset → fixture awal (1.000, Orbit, tanpa listing/favorit/aktivitas) setelah relaunch |
| Maestro rollback favorit/listing | PASS, 1/1 flow, 1m 56s | Fault watchlist dan listing: pesan gagal, setelah relaunch tidak ada favorit/listing/aktivitas, saldo 1.000 |
| Release smoke tanpa Metro, offline | PASS, 3/3 flow (01 pembelian, 02 listing, 03 discovery) | `app-release.apk` (`com.ravacollect`, tidak debuggable, SHA-256 sesuai di bawah) di Samsung A12, mode pesawat aktif, tanpa Metro/adb reverse. Flow 04/05 butuh kontrol fault sehingga hanya di E2E |
| Release tanpa kontrol fault di UI | PASS | `e2e.toggle` tidak terlihat pada build release (flow tangkapan portfolio) |

Log tersedia lokal di `artifacts/`; folder artifact diabaikan Git. Flow Maestro (junit.xml + screenshot): pembelian `maestro-20261006-103701`, listing gagal `maestro-20261006-104219`, listing lulus `maestro-20261006-104601`, discovery `maestro-20261006-105035`, rollback/reset `maestro-20261006-155031`, rollback favorit/listing `maestro-20261006-155447`; release offline `maestro-20261006-160134`, `-160309`, `-160631`; tangkapan portfolio `maestro-20261006-161035` (`artifacts/portfolio-capture.yaml`). Identitas source/APK: `artifacts/source-and-build.json`. APK E2E SHA-256 `0c25962a3c92085145fe65492ab4428fe098b67c7f6c8c280bb1159242b48c03`; release `8daf15a65bd9a3c0572983274bfca0057e3b845a4d09fc5add5dceda4e9df7c0`.

## Traceability

| Requirement | Implementasi | Bukti saat ini |
|---|---|---|
| COL-01–02 | Home discovery/filter/sort; Detail | Source + typecheck; Maestro discovery di Samsung A12 |
| COL-03 | setFavorite; detail; tab favorit | Integration idempotensi, rollback, file persistence; Maestro favorit setelah relaunch dan rollback watchlist |
| COL-04–06 | Ledger; buyArtwork; collection | Integration saldo 1000→750→350, kredit kurang, already-owned, replay/conflict, race 700/600, queue read; RNTL konfirmasi |
| COL-07 | saveListing/deleteListing; form listing; tab listing | Integration lifecycle, validasi, ownership, unique constraint, rollback; Maestro lifecycle dan rollback listing di Samsung A12 |
| COL-08 | Activity snapshot append-only melalui UI | Integration histori lama tidak berubah; kegagalan insert activity menggagalkan transaksi |
| COL-09 | Queue + SQLite transaction, initialize/recovery | Integration rollback pada 3 titik pembelian, watchlist/listing, reopen file, schema/seed tak dikenal, data inconsistent; Maestro fault pembelian/watchlist/listing + retry di Samsung A12 |
| COL-10 | resetDemo atomik + UI konfirmasi | Integration exact fixture dan rollback reset; Maestro batal/konfirmasi reset di Samsung A12 |
| COL-11 | Label, target sentuh, scroll, native navigation | Source saja; TalkBack/font 1.3/layar berbeda belum diuji |

## Temuan dependency

Audit awal: 46 entri high, 0 critical. Advisory akar `braces` GHSA-vfj7-8cjw-p6xm menyebar melalui tooling glob/Jest/Metro/CLI. Audit menawarkan pergantian versi mayor atau downgrade CLI yang tidak boleh diterapkan otomatis tanpa pemeriksaan kompatibilitas. Tidak ada kesimpulan bahwa 46 cacat terpisah dapat dieksploitasi di APK. Simpan laporan mentah `artifacts/npm-audit.json` dan review sebelum publikasi.

## Keterbatasan yang masih terbuka

- Referensi visual Dribbble belum dapat dibuka; desain original dicatat di DESIGN.md.
- 5/5 flow Maestro lulus di Samsung A12 pada APK E2E; 3 flow lulus pada APK release offline tanpa Metro. Batas input dan pemeriksaan isi aktivitas/ledger masih harus dilengkapi.
- APK release ditandatangani dengan debug keystore bawaan template. Cukup untuk sideload demo, tetapi bukan signing publikasi Play Store.
- Belum ada upgrade dari schema lama karena versi awal adalah v1; unknown schema dipertahankan.
- iOS, emulator ukuran berbeda, TalkBack, font scale, serta signing publikasi belum diverifikasi/disiapkan.

## Review konfigurasi build

Review menemukan pemilihan entry berdasarkan nama command global berisiko mencampurkan kontrol fault ke release pada build gabungan. Konfigurasi diubah menjadi entry per `BundleHermesCTask`; task `:app:verifyBundleEntries` sudah lulus untuk kedua variant. Variant E2E memakai `debuggable=false` agar APK memuat bundle lokal tanpa Metro. Kompilasi lengkap dan pemeriksaan source map tetap diperlukan.

Percobaan penetapan staging cache setelah plugin root gagal karena konfigurasi sudah dibaca. Callback dipindah sebelum penerapan plugin root. Build berikutnya berhasil mengonfigurasi native tanpa peringatan panjang path dan mulai kompilasi OP-SQLite. Semua percobaan gagal disimpan, bukan ditandai sebagai pass.

Perangkat fisik sempat tidak terhubung pada 2026-10-06. AVD baru `RavaCollect_API35` dibuat menggunakan image Android 35 Google Play x86_64 yang sudah terpasang; startup belum selesai dan emulator dihentikan untuk mengurangi penggunaan memori. Pengguna kemudian secara eksplisit memilih pengujian langsung pada perangkat fisik. Samsung A12/API 31/ARM64 dengan serial `RR8R20BRP4P` kembali terhubung; semua test perangkat selanjutnya harus memakai target ini. Tidak ada klaim hasil emulator.

Build gabungan ARM64/x86_64 berikutnya berhasil mengompilasi seluruh 57 object native aplikasi ARM64. Kompilasi x86_64 kemudian dihentikan sengaja untuk mengikuti pilihan pengujian perangkat fisik; exit nonzero pada `artifacts/build-combined-cancelled-for-real-device.log` adalah pembatalan, bukan cacat aplikasi. Build dilanjutkan dengan `:app:verifyBundleEntries assembleE2e assembleRelease -PreactNativeArchitectures=arm64-v8a --max-workers=2 --console=plain`, menggunakan kembali cache ARM64 tanpa clean.
