import * as idb from 'idb-keyval'
import { version, files, build, prerendered } from '$service-worker'

// console.log({ version, files, build, prerendered })

// docs: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
// docs: https://web.dev/service-worker-lifecycle/
// docs: https://habr.com/ru/post/535428/

const LOG_PREFIX = `service worker v${version}: `
const STORAGE_PREFIX = 'service-worker-'
const CACHE_KEY_PREFIX = 'app-'
const CACHE_KEY = CACHE_KEY_PREFIX + version
const URLS_VERSIONS: KeyValue<Urls, string> = {
  main : `main-${version}`,
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

const sw: ServiceWorkerGlobalScope = self as any
const URLS_ARRAY = Object.values(URLS).flatMap(o => o)
// const URLS_SET = new Set(URLS_ARRAY)
// const ROUTES_SET = new Set(prerendered)

async function sendMessage(message: any, transfer?: Transferable[]) {
  const windows = await sw.clients.matchAll()
  windows.forEach(window => {
    try {
      window.postMessage(message, transfer)
    }
    catch (err) {
      console.error(err)
    }
  })
}

async function logError(error: any) {
  console.error(error)
  await sendMessage({
    type: 'error',
    error,
  })
}

function getRangeableResponse(request, resp){
	// Return the response, obeying the range header if given
	// NOTE: Does not support 'if-range' or multiple ranges!
	// TODO: Temporary implementation, waiting on official fix:
	// https://github.com/whatwg/fetch/issues/144
	// https://github.com/slightlyoff/ServiceWorker/issues/703

	// Validate range value (return whole resp if null or invalid)
	if (!request) {
		return resp
	}

	if (!request.headers.get('range')) {
		return resp
	}

	// return createPartialResponse(request, resp)

	let range = /^bytes=(\d*)-(\d*)$/gi.exec(request.headers.get('range'))
	if (range === null || (range[1] === '' && range[2] === '')) {
		return resp
	}

	// Get the body as an array buffer
	return resp.arrayBuffer().then(function(ab){
		let total = ab.byteLength
		let start = parseInt(range[1], 10)
		let end = parseInt(range[2], 10)
		// Handle no start value (end is therefore an _offset_ from real end)
		// NOTE: testing on range var, as start/end Number('') -> 0
		if (range[1] === ''){
			start = total - end
			end = total - 1
		}
		// Handle no end value
		if (range[2] === ''){
			end = total - 1
		}
		const data = ab.slice(
			Math.max(0, Math.min(start, end + 1, total)),
			Math.max(0, Math.min(end + 1, total)),
		)
		// Add range headers to response's headers
		let headers = new Headers()
		for (let [k, v] of resp.headers) {
			headers.set(k, v)
		}
		headers.set('Content-Range', `bytes ${start}-${end}/${total}`)
		headers.set('Content-Length', data.byteLength.toString())
		// Return ranged response
		return new Response(data, {
			'status': 206,
			'statusText': 'Partial Content',
			'headers': headers,
		})
	})
}

// endregion

// region events handlers

sw.addEventListener('error', function onError(event) {
  void logError({
    ...event,
    error: event.error && (event.error.stack || event.error + ''),
  })
})

sw.addEventListener('unhandledrejection', function onUnhandledRejection(event) {
  let { reason } = event
  const { detail } = event as any
  if (!reason && detail) {
    reason = detail.reason
  }

  if (reason instanceof Error) {
    void logError(reason)
  }
  else {
    void logError(
      reason
        ? reason.message || String(reason)
        : 'unhandled rejection without reason',
    )
  }
})

sw.addEventListener('message', (event) => {
  if (event.data?.type === 'skipWaiting') {
    void sw.skipWaiting()
  }
})

sw.addEventListener('install', (event) => {
  event.waitUntil((async function install() {
    console.log(LOG_PREFIX + 'installing...')

    const appInfo: AppInfo = await idb.get(STORAGE_PREFIX + 'app')

    if (appInfo?.cacheKey === CACHE_KEY) {
      console.error(LOG_PREFIX + `Service worker reinstalled but CACHE_KEY (${CACHE_KEY}) is not updated`)
      return
    }

    // load new version to new cache
    try {
      const cache = await caches.open(CACHE_KEY)

      if (appInfo?.cacheKey && await caches.has(appInfo.cacheKey)) {
        const prevCache = await caches.open(appInfo.cacheKey)
        // load urls from the prev cache, if their versions is not changes
        await Promise.all(Object.keys(URLS).map(async (cacheKey) => {
          const urls = URLS[cacheKey]
          if (appInfo.urlsVersions[cacheKey] === URLS_VERSIONS[cacheKey]) {
            await Promise.all(urls.map(async (url) => {
              const response = await prevCache.match(url)
              await cache.put(url, response)
            }))
          }
          else {
            await cache.addAll(urls)
          }
        }))
      }
      else {
        await cache.addAll(URLS_ARRAY)
      }

      await idb.set(STORAGE_PREFIX + 'app', {
        cacheKey    : CACHE_KEY,
        urlsVersions: URLS_VERSIONS,
      } as AppInfo)
    }
    catch (err) {
      console.log(LOG_PREFIX + 'delete cache: ' + CACHE_KEY)
      await caches.delete(CACHE_KEY)
      throw err
    }

    console.log(LOG_PREFIX + 'installed')
  })())
})

sw.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    console.log(LOG_PREFIX + 'activating...')

    await sw.clients.claim()

    // delete old caches
    console.log(LOG_PREFIX + 'activating, delete old caches...')
    const cacheKeys = await caches.keys()
    const deleteCacheKeys = cacheKeys.filter(o => o !== CACHE_KEY && o.startsWith(CACHE_KEY_PREFIX))
    await Promise.all(deleteCacheKeys.map(cacheKey => {
      console.log(LOG_PREFIX + 'delete cache: ' + cacheKey)
      return caches.delete(cacheKey)
    }))

    console.log(LOG_PREFIX + 'activated')
  })())
})

sw.addEventListener('fetch', (event) => {
  event.respondWith((async () => {
    const url = new URL(event.request.url)

    const cache = await caches.has(CACHE_KEY) && await caches.open(CACHE_KEY) || null
    // console.log(url)
    // console.log(url.href)
    // console.log(await cache.keys())
    let response = await cache?.match(url.href)

    if (response) {
      console.log(LOG_PREFIX + `fetch from cache ${CACHE_KEY} ${url}`)
    }
    else {
      response = await fetch(event.request)
      if (response.ok) {
        await cache.put(event.request, response.clone()) // for sapper only, see this issue: https://github.com/sveltejs/sapper/issues/625\
      }
      console.log(LOG_PREFIX + `fetch load ${url}`)
    }

    response = await getRangeableResponse(event.request, response)

    return response
  })())
})

// endregion
