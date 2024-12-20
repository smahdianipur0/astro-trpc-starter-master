import { type Arguments as CacheKey, serialize, createCacheHelper } from 'swr/_internal';  
import { SWRConfig } from 'swr';  
import { createSignal } from 'solid-js';  // Import createSignal from Solid

function createCacheHelperV2<Data>(_k: CacheKey) {
  const [key] = serialize(_k);
  if (!key  || typeof key !== 'string') {
    throw Error('wrong key');
  }

  let localCache: Data | undefined;
  const [get, set] = SWRConfig.defaultValue.cache ? createCacheHelper(SWRConfig.defaultValue.cache, key) : [];

  return { 
    get cache() {
      return localCache;
    },
    setCache: (data: Data) => {
      localCache = data;
      if (set) {
        set({ data });
      }
      return data;
    },
  };
} 

const swr = {

  requestControllers: new Map<string, AbortController>(),
  requestIds: new Map<string, number>(),
  cleanupFunctions: new Map<string, () => void>(),
  cacheHelpers: new Map<string, ReturnType<typeof createCacheHelperV2>>(),

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
  ): Promise<[() => Data | undefined, () => Error | undefined]> {
    if (!this.cacheHelpers.has(key as string)) {
      this.cacheHelpers.set(key as string, createCacheHelperV2<Data>(key));
    }
    const cacheHelper = this.cacheHelpers.get(key as string)!;

    const [dataSignal, setDataSignal] = createSignal<Data | undefined>(cacheHelper.cache);
    const [errorSignal, setErrorSignal] = createSignal<Error | undefined>(undefined);
  
    const requestId = (this.requestIds.get(key as string) || 0) + 1;
    this.requestIds.set(key as string, requestId);
  
    const fetchWithTimeout = async (): Promise<Data> => 
      Promise.race([
        fetcher(key),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out')), 10000)
        )
      ]);
  
    const fetchAndUpdate = async (): Promise<void> => {
      let lastError: Error | undefined;
  
      if (cacheHelper.cache !== undefined) {
        setDataSignal(cacheHelper.cache);
        setErrorSignal(undefined);
      }
  
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const data = await fetchWithTimeout();
          if (requestId === this.requestIds.get(key as string)) {
            setDataSignal(data);
            cacheHelper.setCache(data);
            setErrorSignal(undefined);
            return;
          }
        } catch (error) {
          lastError = error as Error;
  
          if (cacheHelper.cache !== undefined) {
            setDataSignal(cacheHelper.cache);
            setErrorSignal(undefined);
            
            if (error instanceof Error && 
                (error.message === 'Network request failed' || 
                 error.message === 'Failed to fetch')) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
          } else {
            setErrorSignal(lastError);
            setDataSignal(undefined);
          }
          
          if (attempt === 2 || 
              !(error instanceof Error && 
                (error.message === 'Network request failed' || 
                 error.message === 'Failed to fetch'))) {
            return;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    };
  
    fetchAndUpdate();

    if (options.autoRefresh) {
      const cleanup = this.onFocus(fetchAndUpdate);
      this.cleanupFunctions.set(key as string, cleanup);
    }

    return [dataSignal, errorSignal];
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
    this.cacheHelpers.delete(key);
  }
};  

export default swr;