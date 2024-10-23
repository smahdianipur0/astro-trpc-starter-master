import { type Arguments as CacheKey, serialize, createCacheHelper } from 'swr/_internal';  
import { SWRConfig } from 'swr';  

function createCacheHelperV2<Data>(_k: CacheKey) {  
  const [key] = serialize(_k);  
  if (!key) {  
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
    const requestId = (this.requestIds.get(key) || 0) + 1;
    this.requestIds.set(key, requestId);

    if (this.requestControllers.has(key)) {
      this.requestControllers.get(key)?.abort();
    }
    const controller = new AbortController();
    this.requestControllers.set(key, controller);

    try {
      const res = await fetcher(key as K, controller.signal);
      if (requestId === this.requestIds.get(key)) {
        return [res, undefined];
      } else {
        return ["", undefined];
      }
    } catch (error) {
      return [undefined, error];
    } finally {
      this.requestControllers.delete(key);
    }
  },

  async swrFetch<K extends CacheKey, Data>(key: K, fetcher: (v: K) => Promise<Data>): Promise<[Data | undefined, Error | undefined]> {
    const { cache, setCache } = createCacheHelperV2<Data>(key);

    try {
      const fetchPromise = fetcher(key).then(res => {
        setCache(res);
        return res;
      });

      const data = await fetchPromise;
      return [data, undefined];
    } catch (error) {
      return [undefined, error];
    }
  },
};  

export default swr;