import type {Browser, BrowserContext, BrowserContextOptions} from 'playwright'
import {takeScreenShotFromContexts} from './takeScreenShot'
import {delay} from '@flemist/async-utils'
import {browserOptions, Browsers, runInBrowsers} from './browser'
import {e2eTestPool} from './e2eTestPool'
import fse from 'fs-extra'
import {throwIfNotFiniteNumber} from '../throwIfNotFiniteNumber'
import path from 'path'

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

export type CreateContext = (options?: BrowserContextOptions) => Promise<BrowserContext>

export type E2eTestFunc = ({
  createContext: CreateContext,
  onError: TOnError,
}) => Promise<void>

/** вспомогательная функция для удобного запуска e2e тестов */
export async function e2eTest(
  {
    testName,
    browsers,
    delayOnError,
    screenShotsPath,
  }: {
    testName: string,
    browsers: Browsers,
    /** если выбрана опция показывать браузер во время теста,
     * то здесь мы можем указать время задержки при ошибке,
     * чтобы можно было посмотреть на браузер и разобраться в чем проблема */
    delayOnError?: number,
    /** папка, в которую будут складываться скриншоты всех окон браузера после ошибки */
    screenShotsPath?: string,
  },
  /** в этой функции пиши тесты */
  testFunc: E2eTestFunc,
) {
  if (delayOnError == null) {
    delayOnError = process.env.DELAY_ON_ERROR
      ? throwIfNotFiniteNumber(parseInt(process.env.DELAY_ON_ERROR, 10))
      : 0
  }

  const screenShotsPathTest = screenShotsPath && path.resolve(screenShotsPath, testName)
  if (fse.existsSync(screenShotsPathTest)) {
    await fse.remove(screenShotsPathTest)
  }

  const browser: Browser = null

  return runInBrowsers(browsers, (browser) => {
    return e2eTestPool.run(1, async () => {
      const browserName = browser.browserType().name() + ' ' + browser.version()
      const testNameWithBrowser = `${testName} > ${browserName}`
      const screenShotsPathTestBrowser = screenShotsPathTest && path.resolve(screenShotsPathTest, browserName)

      const contexts: BrowserContext[] = []
      const createContext: CreateContext = async (options) => {
        const context = await browser.newContext()
        contexts.push(context)
        return context
      }

      const startTime = Date.now()
      console.log(`Test Start: ${testNameWithBrowser}`)
      try {
        await usingOnError((onError) => {
          return testFunc({
            createContext,
            onError,
          })
        })
        console.log(`Test OK (${((Date.now() - startTime) / 1000).toFixed(1)} sec): ${testNameWithBrowser}`)
      }
      catch (error) {
        let log = `Test Error (${((Date.now() - startTime) / 1000).toFixed(1)} sec): ${testNameWithBrowser}`
        if (screenShotsPathTestBrowser) {
          log += `\r\nScreenshots: ${screenShotsPathTestBrowser}`
        }
        log += `\r\n${error}`

        console.error(log)

        // делаем скриншот всех окон и вкладок браузера и сохраняем их в папку tmp
        if (screenShotsPathTestBrowser) {
          await takeScreenShotFromContexts({
            contexts,
            outputPath: screenShotsPathTestBrowser,
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
