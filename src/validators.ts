export function validateZenKey(key: string): { valid: boolean; reason?: string } {
  const trimmed = key.trim();

  if (!trimmed) {
    return { valid: false, reason: 'Key is empty' };
  }

  if (trimmed.length < 10) {
    return { valid: false, reason: 'Zen key appears too short' };
  }

  return { valid: true };
}
