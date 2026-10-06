import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Routes } from './routes';
import { Artwork } from '../domain/types';
import { ArtworkImage } from '../shared/ArtworkImage';
import { colors as c, credits } from '../shared/theme';
import { Chip, Empty, Icon } from '../shared/ui';
import { useStore } from './Store';
import { s } from './styles';
const tabs = [
  { id: 'discover', title: 'Jelajah' },
  { id: 'heart', title: 'Favorit' },
  { id: 'collection', title: 'Koleksi' },
  { id: 'activity', title: 'Aktivitas' },
] as const;
type Tab = (typeof tabs)[number]['id'];
export function Home({ navigation }: NativeStackScreenProps<Routes, 'Home'>) {
  const { data } = useStore();
  const [tab, setTab] = useState<Tab>('discover');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Semua');
  const [sort, setSort] = useState<'default' | 'asc' | 'desc'>('default');
  const [listings, setListings] = useState(false);
  const categories = ['Semua', ...new Set(data.artworks.map(a => a.category))];
  const results = data.artworks.filter(
    a =>
      (tab !== 'heart' || a.favorite) &&
      (tab !== 'collection' || a.owned) &&
      (tab !== 'discover' ||
        ((category === 'Semua' || category === a.category) &&
          `${a.title} ${a.creatorName}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()))),
  );
  if (tab === 'discover' && sort !== 'default') {
    results.sort((a, b) =>
      sort === 'asc'
        ? a.priceCredits - b.priceCredits
        : b.priceCredits - a.priceCredits,
    );
  }
  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <View style={s.brandRow}>
        <View style={s.brand}>
          <View style={s.logo}>
            <Text style={s.logoText}>r.</Text>
          </View>
          <Text style={s.brandName}>
            rava<Text style={s.brandLight}>collect</Text>
          </Text>
        </View>
        <Pressable
          testID="settings.open"
          accessibilityLabel="Pengaturan demo"
          accessibilityRole="button"
          onPress={() => navigation.navigate('Settings')}
          style={s.iconButton}
        >
          <Icon name="settings" color={c.text} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={s.homeContent}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          testID="credits.open"
          accessibilityRole="button"
          accessibilityLabel={`Saldo ${credits(
            data.balance,
          )} demo. Lihat riwayat kredit`}
          style={s.balanceStrip}
          onPress={() => navigation.navigate('Credits')}
        >
          <Text style={s.eyebrow}>MODE DEMO · LOKAL</Text>
          <Text testID="credits.balance" style={s.balanceText}>
            {credits(data.balance)} <Text style={s.lime}>↗</Text>
          </Text>
        </Pressable>
        {tab === 'discover' ? (
          <>
            <View style={s.hero}>
              <Text style={s.eyebrow}>RUANG UNTUK RASA INGIN TAHU</Text>
              <Text style={s.heroTitle}>
                Temukan seni.{'\n'}Mulai <Text style={s.lime}>koleksimu.</Text>
              </Text>
              <Text style={s.body}>
                Karya pilihan, cerita baru. Eksplorasi dengan kredit demo,
                sepenuhnya milik ruangmu.
              </Text>
            </View>
            <View style={s.search}>
              <Icon name="search" />
              <TextInput
                testID="discovery.search"
                accessibilityLabel="Cari karya atau kreator"
                style={s.searchInput}
                placeholder="Cari karya atau kreator"
                placeholderTextColor={c.muted}
                value={query}
                onChangeText={setQuery}
              />
              {!!query && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Hapus pencarian"
                  testID="discovery.clear"
                  onPress={() => setQuery('')}
                  style={s.iconButton}
                >
                  <Text style={s.body}>×</Text>
                </Pressable>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chips}
            >
              {categories.map(item => (
                <Chip
                  key={item}
                  title={item}
                  active={category === item}
                  testID={`category.${item}`}
                  onPress={() => setCategory(item)}
                />
              ))}
            </ScrollView>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>
                Pilihan untukmu <Text style={s.count}>{results.length}</Text>
              </Text>
              <Pressable
                testID="discovery.sort"
                accessibilityRole="button"
                onPress={() =>
                  setSort(
                    sort === 'default'
                      ? 'asc'
                      : sort === 'asc'
                      ? 'desc'
                      : 'default',
                  )
                }
                style={s.sort}
              >
                <Text style={s.small}>
                  {sort === 'default'
                    ? 'Urutkan ↕'
                    : sort === 'asc'
                    ? 'Harga ↑'
                    : 'Harga ↓'}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={s.hero}>
            <Text style={s.eyebrow}>RUANG PERSONALMU</Text>
            <Text style={s.pageTitle}>
              {tab === 'heart'
                ? 'Yang kamu suka.'
                : tab === 'collection'
                ? 'Koleksimu.'
                : 'Jejak aktivitas.'}
            </Text>
            <Text style={s.body}>
              {tab === 'heart'
                ? 'Simpan inspirasi untuk nanti.'
                : tab === 'collection'
                ? 'Karya yang sudah menjadi koleksi demo kamu.'
                : 'Setiap aksi yang berhasil disimpan, di satu tempat.'}
            </Text>
          </View>
        )}
        {tab === 'collection' && (
          <View style={s.chips}>
            <Chip
              title="Semua karya"
              active={!listings}
              onPress={() => setListings(false)}
            />
            <Chip
              title="Listing lokal"
              active={listings}
              testID="collection.listings"
              onPress={() => setListings(true)}
            />
          </View>
        )}
        {tab === 'activity' ? (
          data.activities.length ? (
            data.activities.map(item => (
              <View key={item.id} style={s.activityRow}>
                <View style={s.activityIcon}>
                  <Icon name="activity" color={c.purple} />
                </View>
                <View style={s.flex}>
                  <Text style={s.rowTitle}>{item.summarySnapshot}</Text>
                  <Text style={s.small}>
                    {new Date(item.createdAt).toLocaleString('id-ID')} ·
                    Tersimpan
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Empty
              title="Cerita dimulai di sini"
              body="Aktivitas pembelian dan listing akan muncul setelah berhasil disimpan."
            />
          )
        ) : tab === 'collection' && listings ? (
          data.listings.length ? (
            data.listings.map(item => {
              const art = data.artworks.find(a => a.id === item.artworkId)!;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={item.id}
                  testID={`listing.item.${item.artworkId}`}
                  style={s.listingRow}
                  onPress={() =>
                    navigation.navigate('Listing', { id: item.artworkId })
                  }
                >
                  <View style={s.thumbnail}>
                    <ArtworkImage assetKey={art.assetKey} size={80} />
                  </View>
                  <View style={s.flex}>
                    <Text style={s.rowTitle}>{art.title}</Text>
                    <Text style={s.lime}>{credits(item.priceCredits)}</Text>
                    <Text style={s.small}>
                      {item.status === 'published'
                        ? 'Published · lokal'
                        : 'Draft'}
                    </Text>
                  </View>
                  <Icon name="arrow" />
                </Pressable>
              );
            })
          ) : (
            <Empty
              title="Belum ada listing"
              body="Buka karya di koleksi untuk membuat listing demo pertama."
            />
          )
        ) : (
          <View style={s.grid}>
            {results.map(art => (
              <ArtCard
                key={art.id}
                artwork={art}
                testID={
                  tab === 'collection'
                    ? `collection.item.${art.id}`
                    : `artwork.${art.id}`
                }
                onPress={() => navigation.navigate('Detail', { id: art.id })}
              />
            ))}
          </View>
        )}
        {tab !== 'activity' &&
          !(tab === 'collection' && listings) &&
          !results.length && (
            <Empty
              title={
                tab === 'heart' ? 'Belum ada favorit' : 'Karya belum ditemukan'
              }
              body={
                tab === 'heart'
                  ? 'Ketuk Simpan favorit di detail karya.'
                  : 'Coba kata kunci lain atau pilih kategori Semua.'
              }
            />
          )}
        <Text style={s.footerNote}>
          Koleksi simulasi. Tanpa uang asli atau wallet.
        </Text>
      </ScrollView>
      <View style={s.tabbar}>
        {tabs.map(t => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.id }}
            key={t.id}
            testID={`tab.${t.id}`}
            style={s.tab}
            onPress={() => setTab(t.id)}
          >
            <Icon name={t.id} color={tab === t.id ? c.lime : c.muted} />
            <Text style={[s.tabText, tab === t.id && s.lime]}>{t.title}</Text>
            {tab === t.id && <View style={s.tabDot} />}
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
function ArtCard({
  artwork: a,
  onPress,
  testID,
}: {
  artwork: Artwork;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${a.title}, ${a.creatorName}, ${credits(
        a.priceCredits,
      )}${a.owned ? ', sudah dimiliki' : ''}`}
      testID={testID}
      onPress={onPress}
      style={s.card}
    >
      <View style={s.cardImage}>
        <ArtworkImage assetKey={a.assetKey} size={170} />
        {a.favorite && (
          <View style={s.favMark}>
            <Icon name="heart" color={c.lime} size={17} />
          </View>
        )}
      </View>
      <View style={s.cardInfo}>
        <Text style={s.cardTitle}>{a.title}</Text>
        <Text style={s.creator}>{a.creatorName}</Text>
        <View style={s.cardDivider} />
        <Text style={s.cardPrice}>{credits(a.priceCredits)}</Text>
        <Text style={[s.cardStatus, a.owned && s.lime]}>
          {a.owned ? '● Di koleksimu' : 'Kredit demo'}
        </Text>
      </View>
    </Pressable>
  );
}
