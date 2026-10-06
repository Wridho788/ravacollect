import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Routes } from './routes';
import { ArtworkImage } from '../shared/ArtworkImage';
import { credits } from '../shared/theme';
import { Button, Field, Message } from '../shared/ui';
import { errorMessage, useStore } from './Store';
import { s } from './styles';
type Screen<N extends keyof Routes> = NativeStackScreenProps<Routes, N>;

export function Detail({ route, navigation }: Screen<'Detail'>) {
  const { data, repo, refresh } = useStore();
  const art = data.artworks.find(a => a.id === route.params.id)!;
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const favorite = async () => {
    setBusy(true);
    setError('');
    try {
      await repo.setFavorite(art.id, !art.favorite);
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.detailImage}>
        <ArtworkImage assetKey={art.assetKey} size={340} />
      </View>
      <View style={s.sectionRow}>
        <Text style={s.eyebrow}>{art.category.toUpperCase()} · EDISI DEMO</Text>
        <Text style={s.lime}>{art.owned ? '● Dikoleksi' : 'Tersedia'}</Text>
      </View>
      <Text style={s.pageTitle}>{art.title}</Text>
      <Text style={s.body}>
        Oleh <Text style={s.white}>{art.creatorName}</Text> · Kreator demo
      </Text>
      <View style={s.pricePanel}>
        <Text style={s.small}>HARGA KOLEKSI</Text>
        <Text style={s.bigPrice}>{credits(art.priceCredits)}</Text>
        <Text style={s.small}>Saldo tersedia: {credits(data.balance)}</Text>
      </View>
      <Text style={s.sectionTitle}>Di balik karya</Text>
      <Text style={s.description}>{art.description}</Text>
      {error && <Message error>{error}</Message>}
      <Button
        title={art.favorite ? 'Hapus dari favorit' : 'Simpan favorit'}
        testID="watchlist.toggle"
        secondary
        disabled={busy}
        onPress={favorite}
      />
      {art.owned ? (
        <>
          <Message>
            Karya ini sudah ada di koleksimu. Tidak dapat dibeli lagi.
          </Message>
          <Button
            title={
              data.listings.some(l => l.artworkId === art.id)
                ? 'Kelola listing'
                : 'Buat listing lokal'
            }
            testID="listing.open"
            onPress={() => navigation.navigate('Listing', { id: art.id })}
          />
        </>
      ) : (
        <Button
          title="Koleksi dengan kredit demo"
          testID="purchase.open"
          onPress={() =>
            navigation.navigate('Checkout', {
              id: art.id,
              price: art.priceCredits,
            })
          }
        />
      )}
      <Text style={s.footerNote}>
        Kepemilikan dan listing hanya berlaku di aplikasi lokal ini.
      </Text>
    </ScrollView>
  );
}
let nextOperation = 0;
export function Checkout({ route, navigation }: Screen<'Checkout'>) {
  const { data, repo, refresh } = useStore();
  const art = data.artworks.find(a => a.id === route.params.id)!;
  const operationId = useRef(
    `purchase-${Date.now()}-${++nextOperation}`,
  ).current;
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const price = route.params.price;
  const buy = async () => {
    if (inFlight.current || success) {
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      await repo.buyArtwork(art.id, operationId, price);
      await refresh();
      setSuccess(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Text style={s.eyebrow}>PEMBELIAN SIMULASI</Text>
      <Text style={s.pageTitle}>
        {success ? 'Kini di koleksimu.' : 'Satu karya,\ncerita baru.'}
      </Text>
      <View style={s.checkoutImage}>
        <ArtworkImage assetKey={art.assetKey} size={220} />
      </View>
      <Text style={s.sectionTitle}>{art.title}</Text>
      <Text style={s.body}>{art.creatorName}</Text>
      {success ? (
        <>
          <Message>
            Pembelian berhasil disimpan. {art.title} sudah menjadi koleksi demo
            kamu.
          </Message>
          <Text testID="purchase.success.balance" style={s.bigPrice}>
            {credits(data.balance)}
          </Text>
          <Button
            title="Lihat karya"
            testID="purchase.done"
            onPress={() => navigation.pop()}
          />
        </>
      ) : (
        <>
          <View style={s.pricePanel}>
            <View style={s.summaryRow}>
              <Text style={s.body}>Saldo saat ini</Text>
              <Text style={s.white}>{credits(data.balance)}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.body}>Harga karya</Text>
              <Text style={s.white}>{credits(price)}</Text>
            </View>
            <View style={s.cardDivider} />
            <View style={s.summaryRow}>
              <Text style={s.white}>Sisa setelah beli</Text>
              <Text style={data.balance >= price ? s.lime : s.errorText}>
                {data.balance >= price
                  ? credits(data.balance - price)
                  : 'Kredit kurang'}
              </Text>
            </View>
          </View>
          <Message>
            Ini transaksi demo lokal. Kredit tidak dapat ditukar dengan uang dan
            tidak ada pembayaran nyata.
          </Message>
          {error && <Message error>{error}</Message>}
          <Button
            title={busy ? 'Menyimpan…' : 'Konfirmasi koleksi'}
            testID="purchase.confirm"
            disabled={busy}
            onPress={buy}
          />
          <Button
            title="Batal"
            secondary
            disabled={busy}
            testID="purchase.cancel"
            onPress={() => navigation.goBack()}
          />
        </>
      )}
    </ScrollView>
  );
}
export function Listing({ route }: Screen<'Listing'>) {
  const { data, repo, refresh } = useStore();
  const art = data.artworks.find(a => a.id === route.params.id)!;
  const existing = data.listings.find(l => l.artworkId === art.id);
  const [price, setPrice] = useState(
    existing ? String(existing.priceCredits) : '',
  );
  const [description, setDescription] = useState(existing?.description ?? '');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const locked = useRef(false);
  const operation = async (action: () => Promise<void>, message: string) => {
    if (locked.current) {
      return;
    }
    locked.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      await refresh();
      setNotice(message);
      setConfirmDelete(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const save = (status: 'draft' | 'published') => {
    if (
      !/^\d+$/.test(price.trim()) ||
      !Number.isSafeInteger(Number(price)) ||
      Number(price) <= 0 ||
      description.trim().length > 300
    ) {
      setError(
        'Harga harus bilangan bulat positif dan deskripsi maksimal 300 karakter.',
      );
      setNotice('');
      return;
    }
    operation(
      () => repo.saveListing(art.id, Number(price), description, status),
      status === 'published'
        ? 'Listing published secara lokal. Saldo dan ownership tetap.'
        : 'Draft berhasil disimpan.',
    );
  };
  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
      >
        <Text style={s.eyebrow}>LISTING SIMULASI</Text>
        <Text style={s.pageTitle}>{art.title}</Text>
        <Text testID="listing.status" style={s.lime}>
          {existing
            ? existing.status === 'published'
              ? 'Published · hanya di perangkat ini'
              : 'Draft tersimpan'
            : 'Belum ada listing'}
        </Text>
        <Message>
          Listing tidak menjual karya ke orang lain. Saldo dan koleksimu tetap
          sama.
        </Message>
        <Field
          label="Harga kredit demo"
          testID="listing.price"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
          editable={!busy}
          placeholder="Contoh: 300"
        />
        <Field
          label="Deskripsi listing"
          testID="listing.description"
          value={description}
          onChangeText={setDescription}
          editable={!busy}
          multiline
          placeholder="Ceritakan karyamu (opsional)"
        />
        <Text style={s.small}>{description.trim().length}/300 karakter</Text>
        {error && <Message error>{error}</Message>}
        {notice && <Message>{notice}</Message>}
        <Button
          title={
            busy
              ? 'Menyimpan…'
              : existing?.status === 'published'
              ? 'Simpan perubahan'
              : 'Simpan draft'
          }
          testID="listing.save"
          disabled={busy}
          onPress={() => save(existing?.status ?? 'draft')}
        />
        <Button
          title={
            existing?.status === 'published'
              ? 'Unpublish ke draft'
              : 'Publish secara lokal'
          }
          testID="listing.publish"
          secondary
          disabled={busy}
          onPress={() =>
            save(existing?.status === 'published' ? 'draft' : 'published')
          }
        />
        {!!existing &&
          (confirmDelete ? (
            <View style={s.pricePanel}>
              <Text style={s.rowTitle}>Hapus listing {art.title}?</Text>
              <Text style={s.body}>Karya dan riwayat tetap disimpan.</Text>
              <Button
                title="Ya, hapus listing"
                testID="listing.delete.confirm"
                danger
                disabled={busy}
                onPress={() =>
                  operation(
                    () => repo.deleteListing(art.id),
                    'Listing dihapus. Karya tetap ada di koleksi.',
                  )
                }
              />
              <Button
                title="Batal hapus"
                testID="listing.delete.cancel"
                secondary
                disabled={busy}
                onPress={() => setConfirmDelete(false)}
              />
            </View>
          ) : (
            <Button
              title="Hapus listing"
              testID="listing.delete"
              danger
              disabled={busy}
              onPress={() => setConfirmDelete(true)}
            />
          ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function Credits() {
  const { data } = useStore();
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Text style={s.eyebrow}>KREDIT DEMO</Text>
      <Text style={s.heroTitle}>{credits(data.balance)}</Text>
      <Text style={s.body}>
        Untuk menjelajah dan mengoleksi. Tidak memiliki nilai uang.
      </Text>
      <View style={s.spacer} />
      <Text style={s.sectionTitle}>Riwayat kredit</Text>
      {data.ledger.map(entry => (
        <View key={entry.id} style={s.activityRow}>
          <View style={s.flex}>
            <Text style={s.rowTitle}>
              {entry.type === 'seed' ? 'Kredit awal demo' : 'Pembelian koleksi'}
            </Text>
            <Text style={s.small}>
              {new Date(entry.createdAt).toLocaleString('id-ID')}
            </Text>
          </View>
          <Text style={entry.deltaCredits > 0 ? s.lime : s.white}>
            {entry.deltaCredits > 0 ? '+' : ''}
            {credits(entry.deltaCredits)}
          </Text>
        </View>
      ))}
      <Message>
        Saldo dihitung dari aktivitas kredit yang berhasil disimpan. Tidak ada
        top-up atau penarikan.
      </Message>
    </ScrollView>
  );
}
export function Settings() {
  const { repo, refresh } = useStore();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const reset = async () => {
    setBusy(true);
    setError('');
    try {
      await repo.resetDemo();
      await refresh();
      setDone(true);
      setConfirm(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Text style={s.eyebrow}>TENTANG RUANG INI</Text>
      <Text style={s.pageTitle}>Bebas bereksplorasi.</Text>
      <Text style={s.description}>
        RavaCollect adalah galeri koleksi digital simulasi. Semua karya, kredit,
        dan listing tersimpan di perangkat ini. Tidak ada wallet, blockchain,
        atau transaksi uang asli.
      </Text>
      <Message>
        Reset mengembalikan 1.000 kredit, karya starter Orbit, dan mengosongkan
        favorit, listing, serta aktivitas demo.
      </Message>
      {error && <Message error>{error}</Message>}
      {done && <Message>Demo direset. Kamu siap mulai lagi.</Message>}
      {confirm ? (
        <View style={s.pricePanel}>
          <Text style={s.sectionTitle}>Mulai ulang demo?</Text>
          <Text style={s.description}>
            Pembelian dan perubahan demo saat ini akan dihapus.
          </Text>
          <Button
            title="Ya, reset demo"
            testID="settings.reset.confirm"
            danger
            disabled={busy}
            onPress={reset}
          />
          <Button
            title="Batal reset"
            testID="settings.reset.cancel"
            secondary
            disabled={busy}
            onPress={() => setConfirm(false)}
          />
        </View>
      ) : (
        <Button
          title="Reset demo"
          testID="settings.reset"
          secondary
          onPress={() => {
            setConfirm(true);
            setDone(false);
          }}
        />
      )}
      <Text style={s.footerNote}>
        RavaCollect · collect-v1{'\n'}Ilustrasi vektor original · Tersedia
        offline
      </Text>
    </ScrollView>
  );
}
