# Milestones — RavaCollect

Tanggal awal: 2026-10-05. Update: 2026-10-06. **Status: source MVP tersedia; static/UI unit/SQLite integration sudah dijalankan. Build native dan E2E masih diverifikasi.**

## M0 — Spesifikasi dan desain

- [x] Buat README, PRD, architecture, TRD, development guide, dan rencana E2E.
- [x] Definisikan batas simulasi, kredit integer, fixture, dan acceptance criteria.
- [ ] Buka/tinjau referensi NFT secara visual; akses tautan sebelumnya belum berhasil.
- [x] Buat rancangan screen/state serta aset original atau berlisensi (DESIGN.md, ilustrasi SVG original).
- [ ] Finalisasi nama aplikasi dan identitas visual sebelum publikasi.

Gate: desain bisa dinilai dan aturan pembelian/listing tidak ambigu.

## M1 — Fondasi

- [x] Scaffold React Native CLI; kunci versi, app ID, dan Android SDK.
- [ ] Jalankan app pada emulator/perangkat dan catat command aktual.
- [x] Implementasikan schema v1, fixture, inisialisasi transaksional/recovery, repository, serta ledger saldo. Upgrade antarversi belum diperlukan.
- [x] Buktikan rollback, unique ownership, operation replay, dan race pada SQLite integration test (19/19 pada host; binding Android menunggu APK).
- [ ] Jalankan smoke Maestro sejak awal agar toolchain E2E terbukti.

## M2 — Alur produk

- [x] Implementasi discovery/detail/filter dan watchlist (device belum diverifikasi).
- [x] Implementasi kredit demo, konfirmasi beli, ownership, serta aktivitas.
- [x] Implementasi listing CRUD dan publish/unpublish lokal.
- [ ] Error, empty state, reset, aksesibilitas, dan selector terverifikasi.
- [ ] Tambahkan flow E2E per perjalanan yang selesai.

## M3 — Verifikasi v1

- [x] Typecheck, lint, unit (5), dan integration (19) lulus; jalankan ulang setelah perubahan berisiko.
- [ ] Semua E2E P0 lulus: pembelian, kredit kurang, double-submit, rollback, relaunch, listing, dan reset.
- [ ] Uji offline, layar kecil/besar, font scale, keyboard, Android Back, dan TalkBack.
- [ ] Simpan log/screenshot serta identitas source/build/device.
- [ ] Smoke APK release tanpa Metro dan tanpa fault hooks.

Gate: tidak ada P0 gagal atau unverified; batas pengujian dicatat eksplisit.

## M4 — Handoff dan publikasi

- [x] Tulis hasil nyata dan command reproduksi di docs/VERIFICATION.md; lengkapi evidence perangkat setelah tersedia.
- [ ] Buat screenshot/video, case study, dan panduan instalasi.
- [ ] Siapkan source serta artifact dengan signing yang sesuai.
- [ ] Publikasikan source/APK dan tautkan dari portofolio pada tahap rilis.

Pekerjaan aktif: selesaikan build native, buktikan entry point release/E2E terpisah, jalankan aplikasi dan Maestro, kemudian perbarui evidence. Tidak ada hasil RavaShop yang dipakai sebagai bukti RavaCollect.
