# RavaCollect — rancangan v0.1

Tanggal: 2026-10-05. Nama kerja tetap RavaCollect. Target Android dahulu, bahasa Indonesia.

## Referensi dan asal visual

Tautan [NFT Crypto Marketplace App](https://dribbble.com/shots/21649405-NFT-Crypto-Marketplace-App) dicoba kembali pada sesi implementasi: web reader gagal dan HTTP langsung menghasilkan 202 dengan body kosong. Tidak ada klaim telah melihat komposisi referensi tersebut. Desain di implementasi ini adalah rancangan original yang bisa direvisi setelah referensi tersedia.

Palet: latar `#101113`, permukaan `#1B1D20`, teks `#F8F6F0`, teks sekunder `#ADB0B9`, aksen lime `#DAFA73`, lavender `#C2AEFF`. Grid dua kolom, sudut membulat, garis tipis, tipografi sistem. CTA utama memakai lime; pesan error memakai warna salmon dan teks eksplisit. Teks tidak dibatasi ke satu baris untuk mempertahankan akses saat font diperbesar.

Empat ilustrasi SVG original dibuat langsung di `src/shared/ArtworkImage.tsx`: Orbit (planet bercincin), Lumen (bola cahaya), Tide (lapisan ombak), Premium (kristal). Tidak ada gambar yang disalin dari Dribbble atau diunduh dari situs stok. Ilustrasi menjadi bagian source proyek dan tersedia offline.

## Peta layar

| Layar | Konten dan aksi | State penting |
|---|---|---|
| Jelajah | Saldo demo, cari karya/kreator, kategori, urutan harga, kartu karya | Hasil kosong; hapus query; kategori tetap aktif |
| Favorit | Karya yang disimpan | Kosong; tambah/hapus via detail; relaunch |
| Detail | Ilustrasi, kreator demo, kategori, deskripsi, harga | Tersedia; dimiliki; gagal simpan favorit |
| Tinjau koleksi | Harga, saldo saat ini, sisa, konfirmasi, batal | Menyimpan; berhasil; kredit kurang; harga berubah; storage error |
| Koleksi | Ownership; tab listing lokal | Starter Orbit; hasil pembelian; draft/published |
| Listing lokal | Harga, deskripsi, simpan, publish/unpublish, hapus | Validasi input; draft; published; konfirmasi hapus; gagal write |
| Aktivitas | Snapshot aksi, timestamp, status tersimpan | Kosong; purchase/listing; tidak ada kontrol edit |
| Kredit demo | Saldo dan ledger | Satu grant awal; debit pembelian |
| Pengaturan | Batas simulasi, reset | Konfirmasi reset; batal; berhasil; gagal |
| Recovery | Pesan data tidak dapat dibuka, coba lagi | Tidak melakukan reset atau menghapus data otomatis |

Navigasi utama: Jelajah, Favorit, Koleksi, Aktivitas. Header membuka kredit/pengaturan. Detail dan form memakai native stack sehingga Android Back kembali ke layar sebelumnya. Form dapat digulir saat keyboard terbuka. Target aksi minimal 48 dp; label aksesibilitas menggunakan bahasa pengguna.

## Keputusan perilaku

- Seed/reset `collect-v1`: aktivitas kosong, ledger satu grant 1.000, Orbit dimiliki, favorit/listing kosong. Grant ditampilkan di riwayat kredit, tidak dipalsukan sebagai aktivitas pembelian.
- Konfirmasi membawa harga yang ditinjau. Repository membaca harga ulang di transaksi; bila berubah, `price-changed` meminta pengguna kembali meninjau harga. Tidak membeli diam-diam pada harga baru.
- Listing yang published tampil di Koleksi → Listing lokal dengan label lokal. Tidak mengubah katalog global, saldo, atau ownership; tidak ada pembeli lain.
- Form satu per artwork. `saveListing` menyimpan atau mengubah listing tunggal tersebut; database menolak baris duplikat. Membuka karya yang sudah memiliki listing menampilkan Kelola listing.
- Simpan pada published mempertahankan status. Unpublish mengubah ke draft. Publish dapat sekaligus membuat listing dari form baru; histori mencatat status hasil.
- Hapus listing harus dikonfirmasi; membatalkan tidak mengubah state. Histori dan ownership tetap ada setelah hapus.
- Busy state menahan double-submit; operation ID pembelian tetap sama selama retry pada layar yang sama. SQLite tetap memvalidasi ownership dan operation ID.
- Tidak ada sukses sebelum commit. Read gagal sesudah commit dapat meminta retry; replay pembelian mengembalikan transaksi lama, bukan debit kedua.

## Batas review

Rancangan bukan persetujuan identitas untuk publikasi. TalkBack, font 1.3, ukuran layar lain, dan tinjauan screenshot harus dibuktikan melalui run nyata pada catatan verifikasi. Jangan menandai M0 referensi visual selesai sebelum referensinya benar-benar terlihat.
