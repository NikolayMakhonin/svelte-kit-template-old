import type {Browser, BrowserContext, Page} from 'playwright'
import {CustomPromise} from '@flemist/async-utils'
import type {ICheckErrorsController} from './CheckErrorsController'
import type {TOnError} from './e2eTest'

export class ContextController {
  readonly browser: Browser
  readonly checkErrorsController: ICheckErrorsController

  constructor({
    browser,
    checkErrorsController,
  }: {
        browser: Browser,
        checkErrorsController: ICheckErrorsController,
    }) {
    this.browser = browser
    this.checkErrorsController = checkErrorsController || {
      checkHttpErrors(page: Page): Promise<void> {
        return Promise.resolve()
      },
      subscribeJsErrors(page: Page, onError: TOnError): Promise<void> {
        return Promise.resolve()
      },
    }
  }

  readonly _errorPromise = new CustomPromise()
  async waitError() {
    await this._errorPromise
  }

  private _error: Error
  onError(error: Error | null) {
    if (!this._error && error) {
      this._error = error
      this._errorPromise.reject(error)
    }
    if (this._error || error) {
      throw this._error || error
    }
  }

  validate() {
    if (this._error) {
      throw this._error
    }
    if (this.isClosed) {
      this.onError(new Error('Context is closed'))
    }
  }

  async newPage(onError: TOnError|null) {
    this.validate()

    // получаем текущий контекст (окно браузера)
    const context = await this.waitOrCreateContext()
    const page = await context.newPage()

    if (onError) {
      // запускаем ловлю JS ошибок для страницы page
      await this.checkErrorsController.subscribeJsErrors(page, onError)
    }

    return page
  }

  private _context: BrowserContext
  private _contextPromise: Promise<BrowserContext>
  getContext() {
    return this._context
  }
  waitContext() {
    return this._contextPromise
  }
  waitOrCreateContext() {
    this.validate()
    if (!this._contextPromise) {
      this._contextPromise = this.browser.newContext().then(o => {
        this._context = o
        return o
      })
    }
    return this._contextPromise
  }

  private _isClosed: boolean
  get isClosed() {
    return this._isClosed
  }

  async close(error?: Error) {
    const context = await this.waitContext()
    if (context && !this._isClosed) {
      this._isClosed = true
      await context.close()
    }
    this.onError(error)
  }
}
