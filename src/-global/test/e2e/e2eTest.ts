import type {Browser, BrowserContext} from 'playwright'
import {takeScreenShotFromContexts} from './takeScreenShot'
import {delay} from '@flemist/async-utils'
import {browserOptions, Browsers, runInBrowsers} from './browser'
import {e2eTestPool} from './e2eTestPool'
import fse from 'fs-extra'
import {throwIfNotFiniteNumber} from '../throwIfNotFiniteNumber'

export type TOnError = (error: Error) => void

export async function usingOnError(func: (onError: TOnError) => Promise<void>) {
  // создаем функцию onError, чтобы можно было прервать выполнение функции с ошибкой из любого места программы
  let onError: (error: Error) => void
  const errorPromise = new Promise((_resolve, _reject) => {
    onError = _reject
  })

  // дожидаемся либо ошибки, либо успешного выполнения функции
  await Promise.race([
    errorPromise,
    func(onError),
  ])
}

/** вспомогательная функция для удобного запуска e2e тестов */
export async function e2eTest(
  {
    testName,
    browsers,
    getContexts,
    delayOnError,
    screenShotsPath,
  }: {
    testName: string,
    browsers: Browsers,
    getContexts: () => BrowserContext[],
    /** если выбрана опция показывать браузер во время теста,
     * то здесь мы можем указать время задержки при ошибке,
     * чтобы можно было посмотреть на браузер и разобраться в чем проблема */
    delayOnError?: number,
    /** папка, в которую будут складываться скриншоты всех окон браузера после ошибки */
    screenShotsPath?: string,
  },
  /** в этой функции пиши тесты */
  testFunc: (browser: Browser, onError: TOnError) => Promise<void>,
) {
  if (delayOnError == null) {
    delayOnError = process.env.DELAY_ON_ERROR
      ? throwIfNotFiniteNumber(parseInt(process.env.DELAY_ON_ERROR, 10))
      : 0
  }

  if (fse.existsSync(screenShotsPath)) {
    await fse.remove(screenShotsPath)
  }

  const browser: Browser = null

  return runInBrowsers(browsers, (browser) => {
    return e2eTestPool.use(1, async () => {
      const browserName = browser.browserType().name() + ' ' + browser.version()
      const testNameWithBrowser = `${browserName} ${testName}`

      const startTime = Date.now()
      console.log(`Test Start: ${browserName} ${testNameWithBrowser}`)
      try {
        await usingOnError((onError) => {
          return testFunc(browser, onError)
        })
        console.log(`Test OK (${((Date.now() - startTime) / 1000).toFixed(1)} sec): ${testNameWithBrowser}`)
      }
      catch (error) {
        let log = `Test Error (${((Date.now() - startTime) / 1000).toFixed(1)} sec): ${testNameWithBrowser}`
        if (screenShotsPath) {
          log += `\r\nScreenshots: ${screenShotsPath}`
        }
        log += `\r\n${error}`

        console.error(log)

        // делаем скриншот всех окон и вкладок браузера и сохраняем их в папку tmp
        if (screenShotsPath) {
          await takeScreenShotFromContexts({
            contexts  : getContexts(),
            outputPath: screenShotsPath,
          })
        }

        // задержка после ошибки и перед закрытием браузера,
        // чтобы можно было посмотреть на браузер и понять в чем проблема
        if (delayOnError && browserOptions && !browserOptions.headless) {
          await delay(delayOnError)
        }

        throw error
      }
    })
  })
}
