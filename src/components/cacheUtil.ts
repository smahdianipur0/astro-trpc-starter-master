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

/**
 * @description Provides an interface cache implementation that does not depend on react-hooks and shares a set of caches with useSWR.
 */
const cacheUtil = {
  /**
   * @description Returns the cache if it exists, otherwise makes a request.
   * @param key Cache key, same as useSWR key
   * @param fetcher Interface request to be called when there is no cache
   * @returns
   */
  async cacheFirst<K extends CacheKey, Data>(key: K, fetcher: (v: K) => Promise<Data>): Promise<Data> {
    const { cache, setCache } = createCacheHelperV2<Data>(key);

    if (cache) {
      return cache;
    }

    const res = await fetcher(key).then(res => {
      setCache(res);
      return res;
    });
    return res;
  },
  /**
   * @description Makes a request and returns the cache first (if any).
   * @param key Cache key, same as useSWR key
   * @param fetcher Interface request to be called during the revalidation phase
   * @returns
   */
  async swr<K extends CacheKey, Data>(key: K, fetcher: (v: K) => Promise<Data>): Promise<Data> {
    const { cache, setCache } = createCacheHelperV2<Data>(key);

    const fetchPromise = fetcher(key).then(res => {
      setCache(res);
      return res;
    });

    return cache || (await fetchPromise);
  },
  /**
   * @description Makes a request, returns the cache if the request fails.
   * @param key Cache key, same as useSWR key
   * @param fetcher Interface request
   * @returns
   */
  async networkFirst<K extends CacheKey, Data>(key: K, fetcher: (v: K) => Promise<Data>): Promise<Data> {
    const { cache, setCache } = createCacheHelperV2<Data>(key);

    try {
      const res = await fetcher(key);
      setCache(res);
      return res;
    } catch (e) {
      if (cache) {
        return cache;
      } else {
        throw e;
      }
    }
  },
};

export default cacheUtil;