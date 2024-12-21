import { type Arguments as CacheKey } from 'swr/_internal';
import { FlatCache } from 'flat-cache';

const cache = new FlatCache();

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

  async swrFetch<K extends CacheKey, Data>(
    key: K,
    fetcher: (v: K, signal?: AbortSignal) => Promise<Data>,
    options: { autoRefresh?: boolean } = { autoRefresh: true }
  ): Promise<[Data | undefined, Error | undefined]> {
    if (typeof key !== 'string') {
      throw Error('wrong key');
    }
    
    const requestId = (this.requestIds.get(key as string) || 0) + 1;
    this.requestIds.set(key as string, requestId);
  
    if (this.requestControllers.has(key as string)) {
      this.requestControllers.get(key as string)?.abort();
    }
    const controller = new AbortController();
    this.requestControllers.set(key as string, controller);
  
    const fetchWithTimeout = async (): Promise<Data> => 
      Promise.race([
        fetcher(key as K, controller.signal),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out')), 10000)
        )
      ]);
  
    const fetchAndUpdate = async (): Promise<[Data | undefined, Error | undefined]> => {
      const cachedData = cache.getKey<Data>(key);
      if (cachedData !== undefined) {
        return [cachedData, undefined];
      }
  
      try {
        const fetchedData = await fetchWithTimeout();
        if (requestId === this.requestIds.get(key)) {
          cache.setKey(key, fetchedData);
          return [fetchedData, undefined];
        }
        return [undefined, undefined];
      } catch (err) {
        const cachedDataAfterError = cache.getKey<Data>(key as string);
        if (cachedDataAfterError !== undefined) {
          return [cachedDataAfterError, undefined];
        }
                
        return [undefined, err as Error];
      } finally {
        this.requestControllers.delete(key as string);
      }
    };
  
    const result = await fetchAndUpdate();

    if (options.autoRefresh) {
      const cleanup = this.onFocus(() => fetchAndUpdate());
      this.cleanupFunctions.set(key, cleanup);
    }

    return result;
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