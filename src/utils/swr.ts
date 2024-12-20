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

  async swrFetch<K extends CacheKey, Data>(
    key: K, 
    fetcher: (v: K) => Promise<Data>,
    options: { autoRefresh?: boolean } = { autoRefresh: true }
  ): Promise<[Data | undefined, Error | undefined]> {  
    const { cache, setCache } = createCacheHelperV2<Data>(key);  
  
    const fetchWithTimeout = async (): Promise<Data> => {
      const response = await Promise.race([
        fetcher(key),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out')), 10000)
        )
      ]);
      return response;
    };
  
    const fetchAndUpdate = async (): Promise<[Data | undefined, Error | undefined]> => {
      let lastError: Error | undefined;
      
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const data = await fetchWithTimeout();
          setCache(data);
          return [data, undefined];
        } catch (error) {
          lastError = error as Error;
          
          if (!(lastError.message === 'Network request failed' ||
                lastError.message === 'Failed to fetch')) {
            break;
          }
  
          if (attempt < 1) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
      }
  
      return [undefined, lastError];
    };
  
    if (options.autoRefresh) {
      this.onFocus(() => {
        fetchAndUpdate();
      });
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
  }
};  

export default swr;