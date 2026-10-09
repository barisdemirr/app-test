import { v4 as uuidv4 } from "uuid";

/** Idempotency-Key: 16-64 karakter. uuid v4 = 36 karakter. */
export const newKey = (): string => uuidv4();
