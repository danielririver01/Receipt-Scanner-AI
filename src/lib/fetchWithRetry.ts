export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  delay = 1000,
  silent = false
): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000)
      });
      if (response.ok) {
        return response;
      }
      if (response.status >= 500 || response.status === 429) {
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        } else {
          return response;
        }
      } else {
        return response;
      }
    } catch (error) {
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  if (!silent) {
    console.warn(`[fetchWithRetry] Failed after ${retries} retries for: ${url}`);
  }
  return null;
}