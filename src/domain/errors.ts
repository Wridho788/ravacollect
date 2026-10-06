export type ErrorCode =
  | 'validation'
  | 'insufficient-credit'
  | 'already-owned'
  | 'not-owned'
  | 'not-found'
  | 'price-changed'
  | 'operation-conflict'
  | 'storage'
  | 'migration';

export class DomainError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

export function validatePrice(price: number): void {
  if (!Number.isSafeInteger(price) || price <= 0) {
    throw new DomainError(
      'validation',
      'Harga harus berupa kredit bulat positif.',
    );
  }
}
