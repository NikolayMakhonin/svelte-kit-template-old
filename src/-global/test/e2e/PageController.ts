import {ContextController} from './ContextController'
import type {Browser, Page} from 'playwright'
import type {ICheckErrorsController} from './CheckErrorsController'
import type {TOnError} from './e2eTest'

export class PageController extends ContextController {
  private readonly _onError: TOnError

  constructor({
    browser,
    checkErrorsController,
    onError,
  }: {
        browser: Browser,
        checkErrorsController: ICheckErrorsController,
        onError: TOnError,
    }) {
    super({
      browser,
      checkErrorsController,
    })

    this._onError = onError
  }

  protected _page: Promise<Page>
  getPage() {
    if (!this._page) {
      this._page = this.newPage(this._onError)
    }
    return this._page
  }
}
