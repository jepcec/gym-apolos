const BASE_URL = "/api";

interface ApiFetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { retries = 3, retryDelay = 500, ...fetchOptions } = options;

  const url = `${BASE_URL}${endpoint}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          "Content-Type": "application/json",
          ...fetchOptions.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Request failed with status ${response.status}`
        );
      }

      return response.json();
    } catch (error) {
      lastError = error as Error;

      if (attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * Math.pow(2, attempt))
        );
      }
    }
  }

  throw lastError;
}
