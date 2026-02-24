export const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const isTimeoutError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === 'ECONNABORTED' || message.includes('timeout');
};

export const isTransientNetworkError = (error) => {
  if (!error) return false;
  if (isTimeoutError(error)) return true;
  if (!error.response) return true;
  const status = error.response?.status;
  return status >= 500;
};

export const runWithRetry = async (task, options = {}) => {
  const {
    retries = 1,
    baseDelayMs = 400,
    shouldRetry = isTransientNetworkError,
  } = options;

  let attempt = 0;
  let lastError = null;
  while (attempt <= retries) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !shouldRetry(error)) {
        throw error;
      }
      const delayMs = baseDelayMs * (attempt + 1);
      await sleep(delayMs);
      attempt += 1;
    }
  }
  throw lastError;
};
