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

const cacheUtil = {  
  
  currentController: null, 
  currentRequestId: 0,   

  async networkFirst<K extends CacheKey, Data>(key: K, fetcher: (v: K, signal?: AbortSignal) => Promise<Data>): Promise<Data> {
   
    const requestId = ++this.currentRequestId;  
    if (this.currentController) {  this.currentController.abort(); }  
    this.currentController = new AbortController(); 

    const { cache, setCache } = createCacheHelperV2<Data>(key);  
    try {  
      const res = await fetcher(key, this.currentController.signal);  
      if (requestId === this.currentRequestId) {  
        setCache(res);  
      } 
      return requestId === this.currentRequestId ? res : cache ?? Promise.reject(new Error('Outdated response'));  
    } catch (e) {   
      if (e.name === 'AbortError') {  
        return cache ?? Promise.reject(new Error('Request was aborted and no cache is available'));  
      } 
      if (cache) {  
        return cache;  
      } else {  
        throw e;  
      }  
    } finally {   
      this.currentController = null;  
    }  
  },

  async swr<K extends CacheKey, Data>(key: K, fetcher: (v: K) => Promise<Data>): Promise<Data> {
    const { cache, setCache } = createCacheHelperV2<Data>(key);

    const fetchPromise = fetcher(key).then(res => {
      setCache(res);
      return res;
    });

    return cache || (await fetchPromise);
  },
};  

export default cacheUtil;