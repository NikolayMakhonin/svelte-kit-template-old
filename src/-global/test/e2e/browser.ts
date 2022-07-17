import {Browser, chromium, firefox, webkit} from 'playwright'
import type {LaunchOptions, BrowserType} from 'playwright'
import {e2eState} from './global'

export function getBrowserTypeByName(browserTypeName: string) {
  browserTypeName = browserTypeName?.trim().toLowerCase()

  switch (browserTypeName) {
    case '':
    case void 0:
    case 'chromium':
      return chromium
    case 'firefox':
      return firefox
    case 'webkit':
      return webkit
    default:
      throw new Error('Unknown browser type: ' + process.env.BROWSER)
  }
}

export function createBrowser({
  browserType,
  launchOptions,
}: {
  browserType: string | BrowserType,
  launchOptions: LaunchOptions,
}) {
  if (typeof browserType === 'string') {
    browserType = getBrowserTypeByName(browserType)
  }

  const browser = browserType.launch(launchOptions)

  return browser
}

export function createBrowsers({
  browserTypes,
  launchOptions,
}: {
  browserTypes: (string | BrowserType)[],
  launchOptions: LaunchOptions,
}) {
  return browserTypes.map(browserType => {
    return createBrowser({
      browserType,
      launchOptions,
    })
  })
}

export const browserOptions: LaunchOptions = e2eState.browserOptions || {
  // false - показать браузер во время теста
  // true - скрыть браузер во время теста
  headless: process.env.SHOW_BROWSER !== 'true',
  // таймаут по-умолчанию для всех действий в этом браузере
  timeout : 60000,
}
e2eState.browserOptions = browserOptions

export type Browsers = (Promise<Browser>|Browser)[]

/** get common single browser that uses for all tests */
export function getBrowsers() {
  if (!e2eState.browsers) {
    e2eState.browsers = createBrowsers({
      browserTypes: process.env.BROWSERS?.trim()
        ? process.env.BROWSERS?.split(',')
        : ['chromium', 'webkit', 'firefox'],
      launchOptions: browserOptions,
    })
  }

  return e2eState.browsers
}

export async function runInBrowsers(browsers: Browsers, func: (browser: Browser) => Promise<void>|void): Promise<void> {
  const results = await Promise.allSettled(browsers.map(async browser => {
    const _browser = await browser
    return func(_browser)
  }))

  results.forEach(result => {
    if (result.status === 'rejected') {
      throw result.reason
    }
  })
}

// закрываем браузер после завершения всех тестов
afterAll(async () => {
  if (e2eState.browsers) {
    await runInBrowsers(e2eState.browsers, async browser => {
      await browser.close()
    })
  }
})
