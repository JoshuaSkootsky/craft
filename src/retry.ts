export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000 } = options;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = i === maxRetries;
      const message = error instanceof Error ? error.message : '';

      const shouldRetry = !isLastAttempt && (
        message.includes('429') ||
        message.includes('ETIMEDOUT') ||
        message.includes('ECONNRESET') ||
        message.includes('ENOTFOUND')
      );

      if (!shouldRetry) throw error;

      const delay = baseDelay * Math.pow(2, i);
      console.warn(`[retry] Attempt ${i + 1}/${maxRetries} failed, retrying in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}
