import { v4 as uuidv4 } from 'uuid';

export function genTransactionRef(prefix: string): string {
  return `${prefix}-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`;
}
