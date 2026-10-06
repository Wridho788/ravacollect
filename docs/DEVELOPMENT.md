# Development — RavaCollect

Implementasi awal React Native CLI + TypeScript tersedia. Status runtime/build selalu merujuk `VERIFICATION.md`, bukan keberadaan source saja.

## Lingkungan dan dependency

- Node 22.13.0 (`.nvmrc`), npm 11.8.0, Java 17.0.12.
- Android compile/target SDK 36, min SDK 24, build tools 36.0.0, NDK 27.1.12297006.
- Paket aplikasi dikunci di `package.json`; seluruh hasil resolusi ada di `package-lock.json`.
- App normal: `com.ravacollect`; E2E: `com.ravacollect.e2e`. Data keduanya terpisah.
- SQLite native: OP-SQLite 18.2.5. Integration host memakai SQLite nyata dari Node 22 (experimental).

Instalasi ulang: `npm ci`. Jalankan `npm run typecheck`, `npm run lint`, `npm test`, dan `npm run test:integration` dari root.

## Android Windows

Atur `JAVA_HOME` ke JDK 17 dan `ANDROID_HOME` ke Android SDK. `android/local.properties` adalah konfigurasi mesin dan diabaikan Git. Script `scripts/build-android.ps1` memakai lokasi lokal umum jika variabel belum disetel; lokasi lain dapat diberikan melalui environment.

```powershell
# Build E2E dengan bundle offline, khusus ABI perangkat yang diuji.
.\scripts\build-android.ps1 -Variant E2e -Architectures arm64-v8a

# Build normal tanpa panel E2E.
.\scripts\build-android.ps1 -Variant Release -Architectures arm64-v8a

# Seluruh ABI jika diperlukan untuk distribusi internal lebih luas.
.\scripts\build-android.ps1 -Variant Release -Architectures 'armeabi-v7a,arm64-v8a,x86,x86_64'
```

Output standar: `android/app/build/outputs/apk/e2e/app-e2e.apk` dan `android/app/build/outputs/apk/release/app-release.apk`. Periksa evidence sebelum menganggap artifact tersedia/lulus. Release saat bootstrap menggunakan debug signing bawaan template untuk instalasi internal; bukan signing publikasi. Jangan memublikasikannya sebagai production release.

Pada Windows, output native/CMake diarahkan ke `%USERPROFILE%/.rc-native/<checkout-hash>/<module>`. Cache ini dipisahkan per checkout untuk menghindari batas panjang path Ninja/prefab pada direktori proyek yang dalam. Source dan APK tetap di workspace. Konfigurasi memakai DSL resmi [buildStagingDirectory](https://developer.android.com/reference/tools/gradle-api/7.2/com/android/build/api/dsl/Cmake).

Debug dengan Metro: `npm start`, kemudian pada terminal lain `npm run android`. Build normal/release tidak memerlukan Metro. Manifest utama tidak memiliki izin INTERNET; debug menambahkannya untuk Metro.

## Struktur

- `src/app`: navigasi, store, layar produk, styles.
- `src/shared`: UI, format kredit, ikon, ilustrasi SVG original offline.
- `src/domain`: tipe dan validasi harga/error.
- `src/data`: schema v1, fixture, repository, adapter OP-SQLite.
- `tests/integration`: kontrak repository melalui SQLite nyata termasuk file persistence.
- `__tests__`: tes perilaku konfirmasi pembelian melalui RNTL.
- `e2e/TestApp.tsx`, `index.e2e.js`: kontrol fault khusus variant E2E.
- `.maestro`: flow yang baru ditambahkan setelah hierarchy perangkat terverifikasi.
- `artifacts`: evidence lokal (diabaikan Git); jangan menyamakan dengan source.

## Integritas dan fault tests

Jangan mengubah saldo dari komponen. Saldo berasal dari ledger committed. Semua query melewati queue repository agar read tidak melihat write parsial. Purchase, debit, ownership, dan aktivitas menggunakan satu transaksi. Harga konfirmasi dicek lagi sebelum commit. `operationId` yang sama mengembalikan hasil yang sama.

Build E2E memakai repository yang sama dengan normal. Panel E2E mengeksekusi SQL invalid di titik tengah write; tidak memalsukan hasil repository. `index.js` tidak mengimpor panel ini. Entry ditetapkan per task bundle, termasuk ketika E2E dan Release dibangun bersamaan. Task `:app:verifyBundleEntries` memeriksa pemisahannya.

Fixture `collect-v1` dimulai pada database baru; reset lewat UI memerlukan konfirmasi. Persistence journey harus stop/relaunch tanpa clear data. Jangan menghapus data aplikasi lain dan jangan mencampurkan evidence RavaShop dengan RavaCollect.

## Verifikasi dan rilis

Catat command, exit status, source/build hash, fixture, app ID, perangkat/API, log dan screenshot. Hasil SQLite di Node tidak menggantikan pengujian binding Android. iOS memerlukan macOS/Xcode dan pengujian tersendiri.

Audit dependency pertama melaporkan advisory `braces` yang menyebar ke 46 entri rantai Jest/Metro/CLI/RN. Jangan menjalankan `npm audit fix --force` tanpa menilai kompatibilitas; audit mentah ada di `artifacts/npm-audit.json`. Temuan tidak sama dengan bukti eksploitabilitas APK, tetapi harus ditinjau sebelum rilis publik.

