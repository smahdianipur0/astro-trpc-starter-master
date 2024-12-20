import { type Arguments as CacheKey, serialize, createCacheHelper } from 'swr/_internal';  
import { SWRConfig } from 'swr';  

function createCacheHelperV2<Data>(_k: CacheKey) {
  const [key] = serialize(_k);
  if (!key  || typeof key !== 'string') {
    throw Error('wrong key');
  }

  const [get, set] = SWRConfig.defaultValue.cache ? createCacheHelper(SWRConfig.defaultValue.cache, key) : [];

  return {
    cache: get?.().data as Data | undefined,
    setCache: (data: Data) => set?.({ data }),
  };
} 

const swr = {

  requestControllers: new Map<string, AbortController>(),
  requestIds: new Map<string, number>(),
  cleanupFunctions: new Map<string, () => void>(),

  async noStaleMutate<K extends CacheKey, Data>(key: K, fetcher: (v: K, signal?: AbortSignal) => Promise<Data>): Promise<[Data | undefined, Error | undefined]> {
    const requestId = (this.requestIds.get(key as string) || 0) + 1;
    this.requestIds.set(key as string, requestId);

    if (this.requestControllers.has(key as string)) {
      this.requestControllers.get(key as string)?.abort();
    }
    const controller = new AbortController();
    this.requestControllers.set(key as string, controller);

    try {
      const res = await fetcher(key as K, controller.signal);
      if (requestId === this.requestIds.get(key as string)) {
        return [res, undefined];
      } else {
        return [undefined, undefined];
      }
    } catch (error) {
      return [undefined, error] as [undefined, Error];
    } finally {
      this.requestControllers.delete(key as string);
    }
  },

  async swrFetch<K extends CacheKey, Data>(key: K, fetcher: (v: K) => Promise<Data>,
    options: { autoRefresh?: boolean } = { autoRefresh: true }
  ): Promise<[Data | undefined, Error | undefined]> {  
    const { cache, setCache } = createCacheHelperV2<Data>(key);  

    const requestId = (this.requestIds.get(key as string) || 0) + 1;
    this.requestIds.set(key as string, requestId);

    const fetchWithTimeout = async (): Promise<Data> => 
      Promise.race([
        fetcher(key),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out')), 10000)
        )
      ]);

    const fetchAndUpdate = async (): Promise<[Data | undefined, Error | undefined]> => {
      let lastError: Error | undefined;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const data = await fetchWithTimeout();
          if (requestId === this.requestIds.get(key as string)) {
            setCache(data);
            return [data, undefined];
          }
        } catch (error) {
          lastError = error as Error;

          if (attempt === 2 || 
              !(error instanceof Error && (error.message === 'Network request failed' || error.message === 'Failed to fetch'))) {
            return [undefined, lastError];
          }

          this.requestIds.set(key as string, requestId + 1);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      return [undefined, lastError];
    };

    if (options.autoRefresh) {
      const cleanup = this.onFocus(fetchAndUpdate);
      this.cleanupFunctions.set(key as string, cleanup);
    }

    return cache ? [cache, undefined] as [Data, undefined] : await fetchAndUpdate();
  },

  onFocus(callback: () => void) {
    const visibilityHandler = () => {
      if (document.visibilityState !== 'hidden') {
        setTimeout(callback, 0);
      }
    };
    
    const focusHandler = () => {
      setTimeout(callback, 0);
    };
    
    document.addEventListener('visibilitychange', visibilityHandler);
    window.addEventListener('focus', focusHandler);

    return () => {
      document.removeEventListener('visibilitychange', visibilityHandler);
      window.removeEventListener('focus', focusHandler);
    };
  },

  cleanup(key: string) {
    const cleanupFunction = this.cleanupFunctions.get(key);
    if (cleanupFunction) {
      cleanupFunction();
      this.cleanupFunctions.delete(key);
    }
  }
};  

export default swr;