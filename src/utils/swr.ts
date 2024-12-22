import { FlatCache } from 'flat-cache';

type ArgumentsTuple = readonly [any, ...unknown[]];
type CacheKey = string | ArgumentsTuple | Record<any, any> | null | undefined | false;

const cache = new FlatCache();

const swr = {
  requestAbortControllers: new Map<string, AbortController>(),
  requestIdentifiers: new Map<string, number>(),
  cleanupCallbacks: new Map<string, () => void>(),

  async noStaleMutate<K extends CacheKey, Data>(key: K, fetcher: (v: K, signal?: AbortSignal) => Promise<Data>): Promise<[Data | undefined, Error | undefined]> {
    const currentRequestId = (this.requestIdentifiers.get(key as string) || 0) + 1;
    this.requestIdentifiers.set(key as string, currentRequestId);

    if (this.requestAbortControllers.has(key as string)) {
      this.requestAbortControllers.get(key as string)?.abort();
    }
    const abortController = new AbortController();
    this.requestAbortControllers.set(key as string, abortController);

    try {
      const response = await fetcher(key as K, abortController.signal);
      if (currentRequestId === this.requestIdentifiers.get(key as string)) {
        return [response, undefined];
      } else {
        return [undefined, undefined];
      }
    } catch (Error) {
      return [undefined, Error] as [undefined, Error];
    } finally {
      this.requestAbortControllers.delete(key as string);
    }
  },

  async swrFetch<K extends CacheKey, Data>(key: K, fetcher: (v: K, signal?: AbortSignal) => Promise<Data>, retryCount: number = 3): Promise<[Data | undefined, Error | undefined]> {
    const currentRequestId = (this.requestIdentifiers.get(key as string) || 0) + 1;
    this.requestIdentifiers.set(key as string, currentRequestId);

    if (this.requestAbortControllers.has(key as string)) {
      this.requestAbortControllers.get(key as string)?.abort();
    }
    const abortController = new AbortController();
    this.requestAbortControllers.set(key as string, abortController);
    
    const fetchPromise = async (): Promise<[Data | undefined, Error | undefined]> => {
      let err: Error | undefined = undefined;

      for (let attempt = 0; attempt <= retryCount; attempt++) {

        if (attempt > 0) await new Promise(resolve => setTimeout(resolve, 1000 * attempt));

      try {
        const response = await fetcher(key as K, abortController.signal);
        if (currentRequestId === this.requestIdentifiers.get(key as string)) {
          cache.set(key as string, response);
          return [response, undefined];
        } else {
          return [undefined, undefined];
        }
      } catch (Error) {
        err = Error as Error;
        switch (true) {
          case err.message !== 'Failed to fetch':
          case attempt === retryCount:
            return cache.get(key as string) ? [cache.get(key as string), undefined] : [undefined, err] as [undefined, Error];
          } 
        } finally {
          this.requestAbortControllers.delete(key as string);
        } 
      }
        return cache.get(key as string) ? [cache.get(key as string), undefined] : [undefined, err] as [undefined, Error];
    };

    return cache.get(key as string) ? [cache.get(key as string), undefined] ||(await fetchPromise()) : (await fetchPromise()) ;
  },

  revalidatListener: (revalidate: () => void) => {
    const revalidationHandler = () => {
      revalidate();
    };

    const visibilityChangeHandler = () => {
      if (document.visibilityState === 'visible') {
        revalidationHandler();
      }
    };

    const onlineHandler = () => {
      revalidationHandler();
    };

    document.addEventListener('visibilitychange', visibilityChangeHandler);
    window.addEventListener('online', onlineHandler);
  }
};



export default swr;