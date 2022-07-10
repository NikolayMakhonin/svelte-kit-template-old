import idb from 'idb-keyval'
import { version, files, build, prerendered } from '$service-worker';

// docs: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
// docs: https://web.dev/service-worker-lifecycle/

const LOG_PREFIX = `service worker v${version}: `
const STORAGE_PREFIX = 'service-worker-'
const CACHE_KEY = `app${version}`
const URLS_VERSIONS: KeyValue<Urls, string> = {
  main: `main-${version}`,
	files: `files-1`,
}
const URLS: KeyValue<Urls, string[]> = {
  main: [...build, ...prerendered],
  files,
}

// region types

type Urls = 'main' | 'files'

type KeyValue<TKey extends string, TValue> = {
  [key in TKey]: TValue
}

type AppInfo = {
  cacheKey: string,
  urlsVersions: KeyValue<Urls, string>
}

// endregion

// region helpers

// console.log({ version, files, build, prerendered })

// endregion

// region events handlers

self.addEventListener('install', (event) => {
  event.waitUntil(async function install() {
    console.log(LOG_PREFIX + 'installing...')

    const appInfo: AppInfo = await idb.get(STORAGE_PREFIX + 'app')

    if (appInfo?.cacheKey === CACHE_KEY) {
      console.error(`Service worker reinstalled but CACHE_KEY (${CACHE_KEY}) is not updated`)
      return
    }

    const cache = await caches.open(CACHE_KEY)

    if (appInfo?.cacheKey && await caches.has(appInfo.cacheKey)) {
      const prevCache = await caches.open(appInfo.cacheKey)
      await Promise.all(Object.keys(URLS).map(async (cacheKey) => {
        const urls = URLS[cacheKey]
        if (appInfo.urlsVersions[cacheKey] === URLS_VERSIONS[cacheKey]) {
          await Promise.all(urls.map(async (url) => {
            const response = await prevCache.match(url)
            await cache.put(url, response)
          }))
        }
        else {
          await cache.addAll(urls);
        }
      }))
    }
    else {
      await cache.addAll(Object.values(URLS).flatMap(o => o));
    }

    console.log(LOG_PREFIX + 'installed')
  })
})

self.addEventListener('activate', () => {
  console.log(LOG_PREFIX + 'activated')
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  const response = caches.match(url)

  if (response) {
    console.log(LOG_PREFIX + `fetch from cache ${url}`)
    event.respondWith(response)
  }
  else {
    console.log(LOG_PREFIX + `fetch ${url}`)
  }
})

// endregion
