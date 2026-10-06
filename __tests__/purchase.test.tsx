import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Checkout, Listing, Settings } from '../src/app/ProductScreens';
import { useStore } from '../src/app/Store';
import { DomainError } from '../src/domain/errors';

jest.mock('../src/app/Store', () => ({
  useStore: jest.fn(),
  errorMessage: (e: Error) => e.message,
}));
jest.mock('../src/shared/ArtworkImage', () => ({ ArtworkImage: () => null }));
const mockStore = useStore as jest.Mock;
const props = {
  route: {
    key: 'checkout',
    name: 'Checkout',
    params: { id: 'art-lumen', price: 250 },
  },
  navigation: { pop: jest.fn(), goBack: jest.fn() },
};
const data = {
  balance: 1000,
  artworks: [
    {
      id: 'art-lumen',
      title: 'Lumen',
      creatorName: 'Nara',
      priceCredits: 250,
      assetKey: 'lumen',
    },
  ],
};
beforeEach(() => jest.clearAllMocks());

test('confirmation shows the expected debit and remaining balance', () => {
  mockStore.mockReturnValue({ data, repo: {}, refresh: jest.fn() });
  render(<Checkout {...(props as any)} />);
  expect(screen.getByText('250 kredit')).toBeOnTheScreen();
  expect(screen.getByText('750 kredit')).toBeOnTheScreen();
  expect(screen.queryByTestId('purchase.success.balance')).toBeNull();
});

test('double submit waits for one committed purchase before announcing success', async () => {
  let finish!: () => void;
  const purchase = jest.fn(
    () =>
      new Promise<void>(resolve => {
        finish = resolve;
      }),
  );
  const refresh = jest.fn().mockResolvedValue(undefined);
  mockStore.mockReturnValue({ data, repo: { buyArtwork: purchase }, refresh });
  render(<Checkout {...(props as any)} />);
  fireEvent.press(screen.getByTestId('purchase.confirm'));
  fireEvent.press(screen.getByTestId('purchase.confirm'));
  expect(purchase).toHaveBeenCalledTimes(1);
  expect(purchase).toHaveBeenCalledWith('art-lumen', expect.any(String), 250);
  expect(screen.queryByTestId('purchase.success.balance')).toBeNull();
  await act(async () => {
    finish();
  });
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Kini di koleksimu.')).toBeOnTheScreen();
});

test('storage failure shows an error and retry preserves operation id', async () => {
  const purchase = jest
    .fn()
    .mockRejectedValue(new DomainError('storage', 'Gagal menyimpan'));
  const refresh = jest.fn();
  mockStore.mockReturnValue({ data, repo: { buyArtwork: purchase }, refresh });
  render(<Checkout {...(props as any)} />);
  fireEvent.press(screen.getByTestId('purchase.confirm'));
  await waitFor(() =>
    expect(screen.getByText('Gagal menyimpan')).toBeOnTheScreen(),
  );
  expect(refresh).not.toHaveBeenCalled();
  expect(screen.queryByTestId('purchase.success.balance')).toBeNull();
  fireEvent.press(screen.getByTestId('purchase.confirm'));
  await waitFor(() => expect(purchase).toHaveBeenCalledTimes(2));
  expect(purchase.mock.calls[0][1]).toBe(purchase.mock.calls[1][1]);
});

test('invalid listing input cannot reach the repository', () => {
  const saveListing = jest.fn();
  mockStore.mockReturnValue({
    data: { ...data, listings: [] },
    repo: { saveListing },
    refresh: jest.fn(),
  });
  render(
    <Listing
      {...({ ...props, route: { ...props.route, name: 'Listing' } } as any)}
    />,
  );
  for (const invalid of ['0', '-1', '1.5', '9007199254740992']) {
    fireEvent.changeText(screen.getByTestId('listing.price'), invalid);
    fireEvent.press(screen.getByTestId('listing.save'));
    expect(screen.getByTestId('feedback.error')).toBeOnTheScreen();
  }
  fireEvent.changeText(screen.getByTestId('listing.price'), '300');
  fireEvent.changeText(
    screen.getByTestId('listing.description'),
    'x'.repeat(301),
  );
  fireEvent.press(screen.getByTestId('listing.publish'));
  expect(saveListing).not.toHaveBeenCalled();
});

test('reset cancellation preserves state and only explicit confirmation resets', async () => {
  const resetDemo = jest.fn().mockResolvedValue(undefined);
  const refresh = jest.fn().mockResolvedValue(undefined);
  mockStore.mockReturnValue({ repo: { resetDemo }, refresh });
  render(<Settings />);
  fireEvent.press(screen.getByTestId('settings.reset'));
  fireEvent.press(screen.getByTestId('settings.reset.cancel'));
  expect(resetDemo).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId('settings.reset'));
  fireEvent.press(screen.getByTestId('settings.reset.confirm'));
  await waitFor(() =>
    expect(
      screen.getByText('Demo direset. Kamu siap mulai lagi.'),
    ).toBeOnTheScreen(),
  );
  expect(resetDemo).toHaveBeenCalledTimes(1);
  expect(refresh).toHaveBeenCalledTimes(1);
});
