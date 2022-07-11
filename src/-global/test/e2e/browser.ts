import {Browser, chromium, firefox, webkit} from 'playwright'
import type {LaunchOptions, BrowserType} from 'playwright'

export function getBrowserTypeByName(browserTypeName: string) {
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

export const browserOptions: LaunchOptions = {
  // false - показать браузер во время теста
  // true - скрыть браузер во время теста
  headless: process.env.SHOW_BROWSER !== 'true',
  // таймаут по-умолчанию для всех действий в этом браузере
  timeout : 60000,
}

let browser: Promise<Browser>
/** get common single browser that uses for all tests */
export function getBrowser() {
  if (!browser) {
    browser = createBrowser({
      browserType  : process.env.BROWSER,
      launchOptions: browserOptions,
    })
  }

  return browser
}

// закрываем браузер после завершения всех тестов
after(async () => {
  const _browser = await browser
  if (_browser) {
    await _browser.close()
  }
})
