import urlJoin from 'url-join'
import {e2eTest} from 'src/-global/test/e2e/e2eTest'
import {getBrowsers, createBrowser} from 'src/-global/test/e2e/browser'
import {createCheckErrorsController} from 'src/-common/test/e2e/createCheckErrorsController'
import {calcPerformanceAsync} from 'rdtsc'
import type {Browser, BrowserContext, Page, Worker} from 'playwright'
import {ChildProcess, spawn} from 'child_process'
import type {CheckErrorsController} from 'src/-global/test/e2e/CheckErrorsController'
import {removeConsoleColor} from 'src/-global/test/helpers/removeConsoleColor'

function exec<T = void>(
  command,
  callback?: (
    proc: ChildProcess,
    resolve: (value: T) => void,
    reject: (err: any) => void,
    stdout: string,
    exit: boolean,
  ) => void,
) {
  return new Promise<T>((resolve, reject) => {
    console.log('run: ' + command)
    function _resolve(value: T) {
      console.log('completed: ' + command)
      resolve(value)
    }

    const proc = spawn(command, {
      shell: true,
      env  : {
        NODE_ENV: 'development',
      },
    })
    proc.stdout.on('data', (data: Buffer) => {
      let text = data.toString('utf8')
      console.log(text)
      text = removeConsoleColor(text)
      // process.stdout.write(data)
      if (callback) {
        callback(proc, _resolve, reject, text, false)
        return
      }
    })
    proc.stderr.on('data', (data: Buffer) => {
      let text = data.toString('utf8')
      console.warn(text)
      text = removeConsoleColor(text)
      // process.stderr.write(data)
      if (callback) {
        callback(proc, _resolve, reject, text, false)
        return
      }
    })
    proc.on('exit', (code) => {
      if (code) {
        const message = 'exit code: ' + code
        console.error(message)
        reject(new Error(message))
        assert.fail(message)
        return
      }
      _resolve(void 0)
    })
    proc.on('error', (err) => {
      console.error(err)
      reject(err)
      assert.fail(err.stack || err.toString())
    })
  })
}

describe('service-worker', function () {
  // this.timeout(300000)

  it('install and update', async function () {
    const browsers = getBrowsers()

    function preview(port?: number) {
      const command = 'vite preview' + (port ? ` --port ${port}` : '')
      return exec<PreviewState>(command, (proc, resolve, reject, stdout) => {
        const port = parseInt(stdout.match(/http:\/\/localhost:(\d+)/)?.[1] || '0', 10)
        if (port) {
          resolve({
            port,
            kill: () => {
              if (proc.exitCode != null) {
                throw new Error('exit code: ' + proc.exitCode)
              }
              return new Promise<void>((resolve, reject) => {
                proc.on('exit', (code) => {
                  resolve()
                })
                proc.kill()
              })
            },
          })
        }
      })
    }

    function build() {
      return exec('vite build')
    }

    type PreviewState = {
      port: number,
      kill: () => Promise<void>,
    }

    let previewState: PreviewState
    function getHost() {
      return 'http://localhost:' + previewState.port
    }

    let checkErrorsController: CheckErrorsController

    async function previewRun() {
      if (previewState) {
        throw new Error('preview already run')
      }

      const port = previewState?.port
      previewState = await preview(port)
      if (port) {
        assert.strictEqual(previewState.port, port)
      }

      if (!checkErrorsController) {
        checkErrorsController = createCheckErrorsController({
          host: getHost(),
        })
      }
    }

    async function previewStop() {
      if (!previewState) {
        throw new Error('preview is not run')
      }

      await previewState.kill()
    }

    await e2eTest({
      testName       : 'service-worker > install and update',
      browsers,
      screenShotsPath: 'tmp/test/e2e/service-worker/install-and-update',
    }, async ({createContext, onError}) => {
      await build()
      await previewRun()

      const context = await createContext()
      const page = await context.newPage()
      await checkErrorsController.subscribeJsErrors(page, onError)

      let prevHtml: string
      async function mainPageTest({
        name,
        reload,
        changed,
        waitNewServiceWorker,
      }: {
        name: string,
        reload?: boolean,
        changed?: boolean,
        waitNewServiceWorker?: boolean,
      }) {
        console.log(`mainPageTest(name: ${name}, reload: ${reload}, changed: ${changed})`)
        const serviceworkerPromise = waitNewServiceWorker && new Promise<Worker>((resolve, reject) => {
          context.once('serviceworker', resolve)
        })

        if (!reload) {
          await page.goto(urlJoin(getHost(), '/'), {waitUntil: 'networkidle'})
          // await page.waitForSelector('link')
        }
        else {
          await page.reload({waitUntil: 'networkidle'})
        }

        const serviceworker = await serviceworkerPromise

        await checkErrorsController.checkHttpErrors(page)

        const html = await page.innerHTML('html')
        console.log('html: ' + html?.length)

        if (prevHtml) {
          if (changed) {
            assert.notStrictEqual(html, prevHtml)
          }
          else {
            assert.strictEqual(html, prevHtml, name)
          }
        }
        prevHtml = html
      }

      await mainPageTest({name: 'first online'})
      await mainPageTest({name: 'first online', reload: true})

      await previewStop()

      await mainPageTest({name: 'first offline'})
      await mainPageTest({name: 'first offline', reload: true})

      await build()

      await mainPageTest({name: 'rebuild offline'})
      await mainPageTest({name: 'rebuild offline', reload: true})

      await previewRun()

      await mainPageTest({name: 'rebuild online'})
      await mainPageTest({name: 'rebuild online', changed: true})
      await mainPageTest({name: 'rebuild online', reload: true})

      await context.close()
    })

    console.log('e2e OK')
  }, 120000)

  it.skip('perf', async function () {
    let browser: Browser
    let context: BrowserContext
    let page: Page

    const result = await calcPerformanceAsync(
      10000,
      () => {},
      async () => {
        browser = await createBrowser({
          browserType  : 'chromium',
          launchOptions: {

          },
        })
      },
      async () => {
        context = await browser.newContext()
      },
      async () => {
        page = await context.newPage()
      },
      async () => {
        await page.goto('about:blank', {waitUntil: 'networkidle'})
      },
      async () => {
        await page.close()
      },
      async () => {
        await context.close()
      },
      async () => {
        await browser.close()
      },
    )

    const totalTime = result.absoluteDiff.reduce((a, o) => a + o, 0)
    const browserTime = result.absoluteDiff[0] + result.absoluteDiff[result.absoluteDiff.length - 1]
    const pageTime = totalTime - browserTime
    console.log('browserTime / pageTime = ' + browserTime / pageTime)
    console.log(result)
  }, 60000)
})
