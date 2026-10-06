import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeRepository } from '../data/native';
import { RavaRepository } from '../data/repository';
import { Snapshot } from '../domain/types';
import { Button, Message } from '../shared/ui';
import { colors } from '../shared/theme';

type Store = {
  repo: RavaRepository;
  data: Snapshot;
  refresh: () => Promise<void>;
};
const Context = createContext<Store | null>(null);
let repository: RavaRepository | undefined;
export function StoreProvider({
  children,
  suppliedRepository,
}: PropsWithChildren<{ suppliedRepository?: RavaRepository }>) {
  const [data, setData] = useState<Snapshot>();
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setData(await repository!.snapshot());
  }, []);
  const load = useCallback(async () => {
    setError('');
    try {
      repository ??= suppliedRepository ?? createNativeRepository();
      await repository.initialize();
      await refresh();
    } catch {
      setError(
        'Data lokal belum dapat dibuka. Data tetap disimpan. Coba lagi; jika tetap gagal, hubungi pengembang untuk pemulihan.',
      );
    }
  }, [refresh, suppliedRepository]);
  useEffect(() => {
    load();
  }, [load]);
  if (error || !data) {
    return (
      <View style={styles.recovery}>
        {error ? (
          <>
            <Message error>{error}</Message>
            <Button title="Coba lagi" onPress={load} />
          </>
        ) : (
          <ActivityIndicator
            color={colors.lime}
            accessibilityLabel="Membuka koleksi"
          />
        )}
      </View>
    );
  }
  return (
    <Context.Provider value={{ repo: repository!, data, refresh }}>
      {children}
    </Context.Provider>
  );
}
const styles = StyleSheet.create({
  recovery: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
  },
});
export function useStore() {
  const value = useContext(Context);
  if (!value) {
    throw new Error('StoreProvider is required');
  }
  return value;
}
export function errorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    'insufficient-credit': 'Kredit demo tidak cukup untuk karya ini.',
    'already-owned': 'Karya ini sudah ada di koleksimu.',
    'price-changed':
      'Harga berubah. Kembali ke detail dan tinjau harga terbaru sebelum membeli.',
    validation:
      'Periksa input. Harga harus bilangan bulat positif, deskripsi maksimal 300 karakter, dan karya harus dimiliki.',
    storage: 'Perubahan gagal disimpan. Coba lagi.',
    migration: 'Versi data belum didukung. Data dipertahankan untuk pemulihan.',
  };
  return messages[code ?? ''] ?? 'Operasi belum dapat diselesaikan. Coba lagi.';
}
