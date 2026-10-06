# RavaCollect

Aplikasi Android React Native CLI untuk eksplorasi karya, favorit, pembelian dengan kredit demo, koleksi pribadi, dan listing lokal. Data disimpan di SQLite. Tidak ada wallet, blockchain, transaksi uang asli, atau backend.

**Status: fitur MVP selesai dan diverifikasi sebagian.** Di Samsung Galaxy A12 (Android 12), 5/5 flow Maestro lulus pada build E2E dan 3 flow lulus pada APK release offline tanpa Metro; 19 tes integrasi SQLite dan 5 tes UI lulus. iOS, TalkBack, font besar, dan signing publikasi belum diverifikasi. Detail dan batas cakupan ada di [VERIFICATION](docs/VERIFICATION.md).

## Mulai

Node 22.13.0, JDK 17, Android SDK 36. Dependency terkunci pada lockfile.

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run test:integration
.\scripts\build-android.ps1 -Variant E2e
```

Untuk debug interaktif: `npm start`, lalu `npm run android` pada terminal lain. Lihat [Development](docs/DEVELOPMENT.md) untuk build, signing, app ID, dan lokasi artifact.

## Yang tersedia di source

- Discovery, pencarian/filter/urutan harga, detail dan favorit.
- Ledger kredit, konfirmasi pembelian atomik/idempotent, koleksi dan aktivitas.
- Listing draft/published lokal, edit/hapus, serta reset dengan konfirmasi.
- Empat ilustrasi vektor original yang dibundel offline.
- Tes SQLite nyata, tes UI pembelian, dan variant E2E terpisah untuk fault injection.

Saldo awal 1.000 kredit; Orbit dimiliki. Lumen 250, Tide 400, Premium 1.500. Membeli Lumen lalu Tide menghasilkan saldo 350. Listing tidak menambah pendapatan atau menghapus kepemilikan.

## Dokumen

- [PRD](docs/PRD.md) — kebutuhan dan acceptance criteria.
- [Architecture](docs/ARCHITECTURE.md) — batas sistem dan integritas.
- [TRD](docs/TRD.md) — kontrak data dan stack.
- [Design](docs/DESIGN.md) — layar, state, keputusan perilaku, asal aset.
- [Milestones](docs/MILESTONES.md) — checklist pekerjaan.
- [Development](docs/DEVELOPMENT.md) — setup dan commands.
- [E2E test plan](docs/E2E_TEST_PLAN.md) — matriks skenario.

Nama RavaCollect masih nama kerja. Referensi Dribbble pada dokumen awal belum dapat diakses; implementasi visual adalah rancangan original, bukan klaim telah menyalin atau meninjau referensi. Android menjadi target pertama; iOS belum diuji.
