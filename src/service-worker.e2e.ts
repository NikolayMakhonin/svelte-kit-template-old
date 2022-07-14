import urlJoin from 'url-join'
import {e2eTest} from 'src/-global/test/e2e/e2eTest'
import {createBrowser, getBrowsers} from 'src/-global/test/e2e/browser'
import {createCheckErrorsController} from 'src/-common/test/e2e/createCheckErrorsController'
import {calcPerformanceAsync} from 'rdtsc'
import type {Browser, BrowserContext, Page, Worker} from 'playwright'
import {ChildProcess, spawn, SpawnOptionsWithoutStdio} from 'child_process'
import type {CheckErrorsController} from 'src/-global/test/e2e/CheckErrorsController'
import {removeConsoleColor} from 'src/-global/test/helpers/removeConsoleColor'

class Proc {
  readonly command: string
  readonly proc: ChildProcess
  readonly logPrefix: string
  constructor(command: string, options?: SpawnOptionsWithoutStdio) {
    this.proc = spawn(command, {
      shell: true,
      env  : {
        NODE_ENV: 'development',
      },
      ...options,
    })

    this.logPrefix = `${command} (${this.proc.pid}): `
    console.log(this.logPrefix + 'run')
  }

  wait<T = void>(callback?: (args: {
    resolve: (value: T) => void,
    reject: (err: any) => void,
    data: string,
  }) => void) {
    return new Promise<T>((resolve, reject) => {
      const _this = this

      function unsubscribe() {
        _this.proc.stdout.off('data', onStdOut)
        _this.proc.stderr.off('data', onStdErr)
        _this.proc.off('exit', onExit)
        _this.proc.off('error', onError)
      }

      function _resolve(value: T) {
        unsubscribe()
        console.log(_this.logPrefix + 'resolve')
        resolve(value)
      }

      function _reject(err: any) {
        unsubscribe()
        reject(err)
      }

      function onData(data: Buffer, stderr: boolean) {
        let text = data.toString('utf8')

        if (stderr) {
          console.log(_this.logPrefix + text)
        }
        else {
          console.warn(_this.logPrefix + text)
        }

        text = removeConsoleColor(text)

        if (callback) {
          callback.call(_this, {resolve: _resolve, reject: _reject, data: text})
          return
        }
      }

      function onStdOut(data: Buffer) {
        onData(data, false)
      }

      function onStdErr(data: Buffer) {
        onData(data, false)
      }

      function onExit(code: number) {
        if (code) {
          const message = _this.logPrefix + `exit code ${code}`
          console.error(message)
          reject(new Error(message))
          assert.fail(message)
          return
        }
        _resolve(void 0)
        console.log(_this.logPrefix + 'exit')
      }

      function onError(err: Error) {
        const message = _this.logPrefix + `error ${err?.stack || err}`
        console.error(message)
        reject(err)
        assert.fail(message)
      }

      _this.proc.stdout.on('data', onStdOut)
      _this.proc.stderr.on('data', onStdErr)
      _this.proc.on('exit', onExit)
      _this.proc.on('error', onError)
    })
  }

  kill() {
    if (this.proc.exitCode != null) {
      throw new Error(this.logPrefix + 'Process already killed')
    }
    const killPromise = this.wait()
    this.proc.kill()
    return killPromise
  }
}

describe('service-worker', function () {
  // this.timeout(300000)

  it('install and update', async function () {
    type PreviewState = {
      port: number,
      proc: Proc,
    }

    async function preview(port?: number): Promise<PreviewState> {
      const command = 'vite preview' + (port ? ` --port ${port}` : '')
      const proc = new Proc(command)

      const newPort = await proc.wait<number>(({resolve, reject, data}) => {
        const port = parseInt(data.match(/http:\/\/localhost:(\d+)/)?.[1] || '0', 10)
        if (port) {
          resolve(port)
        }
      })

      return {
        port: newPort,
        proc,
      }
    }

    function build() {
      const proc = new Proc('vite build')
      return proc.wait()
    }

    let port
    function getHost() {
      return 'http://localhost:' + port
    }

    let previewState: PreviewState
    let checkErrorsController: CheckErrorsController

    async function previewRun() {
      if (previewState) {
        throw new Error('preview already run')
      }

      previewState = await preview(port)
      if (port) {
        assert.strictEqual(previewState.port, port)
      }
      else {
        port = previewState.port
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

      await previewState.proc.kill()
      previewState = null
    }

    const browsers = getBrowsers()

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
