import urlJoin from 'url-join'
import {e2eTest} from 'src/-global/test/e2e/e2eTest'
import {createCheckErrorsController} from 'src/-common/test/e2e/createCheckErrorsController'
import type {BrowserContext, Page, Worker} from 'playwright'
import {ChildProcess, spawn, SpawnOptionsWithoutStdio} from 'child_process'
import type {CheckErrorsController} from 'src/-global/test/e2e/CheckErrorsController'
import {removeConsoleColor} from 'src/-global/test/helpers/removeConsoleColor'
import fkill from 'fkill'
import express from 'express'
// import type {Socket} from 'net'
import {delay} from '@flemist/async-utils'

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

  get isAlive() {
    return this.proc.signalCode == null && this.proc.exitCode == null
  }

  async kill() {
    assert.ok(this.isAlive, this.logPrefix + 'Process already killed')

    try {
      this.proc.kill('SIGKILL')
      await fkill(this.proc.pid, {
        force: true,
        // forceAfterTimeout: 5000,
        tree : true,
      })
    }
    catch (err) {
      console.warn(err.message)
    }

    // console.log(JSON.stringify({
    //   killed    : this.proc.killed,
    //   signalCode: this.proc.signalCode,
    //   exitCode  : this.proc.exitCode,
    //   connected : this.proc.connected,
    // }, null, 2))

    assert.ok(!this.isAlive, this.logPrefix + 'Process kill failed')
  }
}

describe('service-worker', function () {
  function test({browserType}: {browserType: string}) {
    return e2eTest({
      testName       : 'service-worker > install and update',
      browserType,
      screenShotsPath: 'tmp/test/e2e/service-worker/install-and-update',
    }, async ({browser, createContext, onError}) => {
      const browserName = browser.browserType().name()
      if (browserName === 'firefox') {
        return
      }

      type PreviewState = {
        port: number,
        proc: Proc,
      }

      async function preview(port?: number): Promise<PreviewState> {
        const command = '"./node_modules/.bin/vite" preview' + (port ? ` --port ${port}` : '')
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
        console.log('build')
        const proc = new Proc('"./node_modules/.bin/vite" build')
        return proc.wait()
      }

      let port
      function getHost() {
        return 'http://localhost:' + port
      }

      let previewState: PreviewState
      let checkErrorsController: CheckErrorsController

      async function previewRun() {
        console.log('previewRun')
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
        console.log('previewStop')
        if (!previewState) {
          throw new Error('preview is not run')
        }

        await previewState.proc.kill()
        try {
          await fkill(':' + port, {
            force: true,
            tree : true,
          })
        }
        catch (err) {
          console.warn(err.message)
        }

        previewState = null
      }

      let expressStop: () => Promise<void>
      async function expressRun() {
        console.log('expressRun')
        assert.ok(!expressStop)
        const app = express().use(function (req, res, next) {
          res.status(404).send('Test server 404').end(() => {
            console.log('close connection')
            req.connection.destroy()
          })
          next()
        })
        await new Promise<void>((resolve, reject) => {
          const listener = app.listen(port, resolve)
          // const connections = new Set<Socket>()
          // listener.on('connection', (connection) => {
          //   connections.add(connection)
          //   connection.on('close', () => {
          //     connections.delete(connection)
          //   })
          // })
          expressStop = () => {
            console.log('expressStop')
            expressStop = null
            // connections.forEach(o => o.destroy())
            // connections.clear()
            return new Promise<void>((resolve, reject) => {
              listener.close((err) => {
                if (err) {
                  reject(err)
                  return
                }
                resolve()
              })
            })
          }
        })
      }

      let context: BrowserContext
      let isChromium: boolean
      let isWebkit: boolean
      let page: Page
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
        const serviceworkerPromise = isChromium && waitNewServiceWorker && new Promise<Worker>((resolve, reject) => {
          context.once('serviceworker', resolve)
        })

        if (!reload) {
          await page.goto(urlJoin(getHost(), '/'), {waitUntil: 'networkidle'})
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

      try {
        await build()
        await previewRun()

        context = await createContext()
        isChromium = browserName === 'chromium'
        page = await context.newPage()

        // disable http cache
        // docs: https://playwright.dev/docs/api/class-page#page-route
        // page.route('/service-worker.js', route => route.continue())
        // page.route('**', route => route.continue())

        // docs: https://playwright.dev/docs/api/class-page#page-event-console
        page.on('console', async msg => {
          const values = []
          for (const arg of msg.args()) {
            values.push(await arg.jsonValue())
          }
          console.log('browser console: ', ...values)
        })

        assert.strictEqual(context.serviceWorkers().length, 0)
        await checkErrorsController.subscribeJsErrors(page, onError)
        await mainPageTest({name: 'first online', waitNewServiceWorker: true})

        for (let i = 0; i < 5; i++) {
          console.log('iteration: ' + i)
          const logPrefix = `${i}: `

          prevHtml = null
          isChromium && assert.strictEqual(context.serviceWorkers().length, 1)
          await mainPageTest({name: logPrefix + 'first online', reload: true})

          await previewStop()

          await mainPageTest({name: logPrefix + 'first offline'})
          await mainPageTest({name: logPrefix + 'first offline', reload: true})
          isChromium && assert.strictEqual(context.serviceWorkers().length, 1)

          await build()

          await mainPageTest({name: logPrefix + 'rebuild offline'})
          isChromium && assert.strictEqual(context.serviceWorkers().length, 1)
          await mainPageTest({name: logPrefix + 'rebuild offline', reload: true})
          isChromium && assert.strictEqual(context.serviceWorkers().length, 1)

          await expressRun()

          await mainPageTest({name: logPrefix + 'rebuild 404'})
          isChromium && assert.strictEqual(context.serviceWorkers().length, 1)
          await mainPageTest({name: logPrefix + 'rebuild 404', reload: true})
          isChromium && assert.strictEqual(context.serviceWorkers().length, 1)
          await page.goto('about:blank', {waitUntil: 'networkidle'})
          await delay(1000)

          await expressStop()

          await previewRun()

          isChromium && assert.strictEqual(context.serviceWorkers().length, 1)
          await mainPageTest({name: logPrefix + 'rebuild online', waitNewServiceWorker: true})
          isChromium && assert.strictEqual(context.serviceWorkers().length, 2)
          await mainPageTest({name: logPrefix + 'rebuild online', changed: true})
          isChromium && assert.strictEqual(context.serviceWorkers().length, 1)
          await mainPageTest({name: logPrefix + 'rebuild online', reload: true})
          isChromium && assert.strictEqual(context.serviceWorkers().length, 1)
        }

        await context.close()

        await previewStop()
      }
      finally {
        if (expressStop) {
          await expressStop()
        }
        if (previewState?.proc.isAlive) {
          await previewState.proc.kill()
        }
      }
    })
  }

  it('install and update > webkit', async function () {
    await test({browserType: 'webkit'})
  }, 240000)

  it('install and update > chromium', async function () {
    await test({browserType: 'chromium'})
  }, 240000)
})
