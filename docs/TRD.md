# TRD — RavaCollect

Status: implementasi awal v0.1. Dependency terkunci di package-lock.json; bukti run dicatat terpisah di VERIFICATION.md.

## Stack

React Native Community CLI, TypeScript strict, navigasi native kompatibel, SQLite transaksional, Jest/React Native Testing Library, dan Maestro. Pilih binding SQLite melalui spike build/transaction/migration pada Android. Lockfile serta versi Node/JDK/SDK dicatat ketika bootstrap, tidak ditebak dari proyek lain.

Pilihan bootstrap: React Native 0.83.10, React 19.2.0, CLI 20.2.0, OP-SQLite 18.2.5, native-stack 7.20.0, screens 4.25.0, safe-area-context 5.7.0, SVG 15.15.5. Lingkungan terdeteksi Node 22.13.0/npm 11.8.0/JDK 17.0.12. Template Android: compile/target 36, min 24, build tools 36.0.0, NDK 27.1.12297006, Gradle 9.0.0. Keberhasilan instalasi paket bukan bukti build native berhasil.

`SqlConnection` adalah seam async kecil; repository yang sama dijalankan dengan OP-SQLite pada Android dan SQLite asli bawaan Node pada integration test. Tes Node membuktikan aturan SQL/use case, sedangkan kompatibilitas binding native wajib dibuktikan melalui APK.

## Model data

| Entitas | Field utama dan constraint |
|---|---|
| Artwork | `id`, `title`, `creatorName`, `category`, `description`, `assetKey`, `priceCredits`; integer positif. |
| Watchlist | `artworkId` unik. |
| Purchase | `id`, `operationId` unik, `artworkId`, `priceCreditsSnapshot`, `createdAt`; satu pembelian per karya pada demo. |
| CreditEntry | `id`, `operationId` unik, `type` seed/purchase, `deltaCredits` integer bertanda, `purchaseId?`, `createdAt`. |
| Ownership | `artworkId` unik, `source` seed/purchase, `purchaseId?`, `acquiredAt`. |
| Listing | `id`, `artworkId` unik, `priceCredits`, `description`, `status` draft/published, timestamps. |
| Activity | `id`, `operationId`, `type`, `entityId`, `summarySnapshot`, `createdAt`; append-only. |
| Metadata | `schemaVersion`, `seedVersion`. |

## Integritas

- `balance = sum(CreditEntry.deltaCredits)`. Nilai adalah integer safe JavaScript, bukan float ETH. Harga listing harus integer positif; deskripsi 0–300 karakter setelah trim.
- Pembelian memerlukan `balance >= price` dan karya belum dimiliki. Validasi diulang di dalam transaksi database.
- Purchase, debit ledger, ownership, dan aktivitas di-commit bersama. Kegagalan di tengah proses tidak meninggalkan salah satunya.
- Operation ID mencegah double-submit. Unique ownership dan write serialization mencegah dua request bersamaan membelanjakan kredit yang sama.
- Publish/unpublish/edit/delete listing tidak mengubah saldo. Listing hanya bisa menunjuk ownership milik profil demo.
- Riwayat berisi snapshot informasi saat aksi, sehingga edit listing tidak menulis ulang event lama.
- Seed dan migrasi versioned; schema tak dikenali menghasilkan recovery state tanpa menghapus data.

## Fixture deterministik

Seed `collect-v1`: saldo 1.000 kredit, starter artwork `owned-orbit` sudah dimiliki dengan source seed. Katalog `art-lumen` seharga 250 kredit dan `art-tide` seharga 400 kredit belum dimiliki; `art-premium` seharga 1.500 kredit untuk negative test. Watchlist dan listing kosong; ledger berisi satu grant awal 1.000.

Aktivitas awal kosong. Harga katalog starter Orbit 180 kredit tetapi ownership awal tidak mendebit saldo. Reset memulihkan fixture yang sama. Schema v1 dibentuk secara atomik pada database baru; schema/seed tak dikenal dipertahankan dan masuk recovery. Belum ada upgrade antarversi karena ini schema pertama.

Membeli Lumen menghasilkan saldo 750, satu debit -250, satu purchase, dan ownership baru. Membeli Tide sesudahnya menghasilkan saldo 350. Lumen tidak dapat dibeli lagi. Listing Lumen pada 300 kredit tidak mengubah saldo 750 jika hanya Lumen yang dibeli.

## Kontrak repository dan feedback

API async: katalog query, watchlist mutation, `getBalance`, `buyArtwork(artworkId, operationId)`, collection query, listing CRUD/publish, activity query, dan `resetDemo`. Hasil hanya sukses sesudah commit; error terstruktur mencakup validation, insufficient-credit, already-owned, storage, dan migration.

API konkret v0.1: `initialize`, `snapshot` (artworks dengan ownership/favorite, balance, listings, activities, ledger), `buyArtwork(artworkId, operationId, expectedPrice?)`, `setFavorite`, `saveListing` (upsert satu listing per artwork), `deleteListing`, dan `resetDemo`. `expectedPrice` dipakai UI untuk menolak perubahan harga setelah konfirmasi dibuka. Semua akses pada connection melewati queue yang sama, termasuk read.

Gunakan testID stabil pada kartu, konfirmasi, saldo, koleksi, dan field listing; cocokkan dengan hierarchy Android. Label aksesibilitas tetap bahasa pengguna. Target sentuh minimal 48dp dan font scale 1.3 masuk review.

## Build dan quality gate

Pisahkan build debug, E2E dengan fault controls, dan release tanpa hook tersebut. Catat app ID, versi, source hash, APK hash, runner, Android API, dan device serial. Jangan menambahkan SDK wallet/key management ke MVP ini.

Unit untuk harga/saldo/validasi; integration SQLite untuk atomicity, replay, race, dan migrasi; device E2E untuk perjalanan pengguna serta persistensi. Smoke release harus berjalan tanpa Metro. iOS dan perangkat fisik tidak dianggap teruji tanpa bukti eksekusi.
