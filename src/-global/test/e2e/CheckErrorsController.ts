/* eslint-disable multiline-ternary,@typescript-eslint/no-shadow,func-names */
import type {Page} from 'playwright'
import type {TOnError} from './e2eTest'

/** Запускай эту функцию перед загрузкой сайта на странице */
export async function subscribeJsErrors({
  page,
  filter,
  onError,
}: {
    page: Page,
    filter?: (error: string) => boolean,
    onError: TOnError
}) {
  const callbackName = 'callback_191b355ea6f64499a6607ad571da5d4d'

  await page.exposeFunction(callbackName, (error: string) => {
    let isError: boolean
    try {
      if (filter && !filter(error)) {
        return
      }
    }
    catch (err) {
      error = err
    }

    try {
      console.error('BROWSER JS ERROR: ' + error)
      onError(new Error(error))
    }
    catch (err) {
      // empty
    }
  })

  await page.addInitScript((callbackName) => {
    function errorToString(err: any): string {
      if (Array.isArray(err)) {
        return err.map(errorToString).join('\r\n\r\n')
      }
      return err instanceof Error
        ? err.stack || err.toString()
        : err + ''
    }

    function onError(error: string) {
      (window as any)[callbackName](error)
    }

    // intercept console
    const consoleOrig = {
      warn : console.warn.bind(console),
      error: console.error.bind(console),
    }
    console.warn = function warn() {
      onError(errorToString(Array.from(arguments)))
      return consoleOrig.warn.apply(this, arguments)
    }
    console.error = function error() {
      onError(errorToString(Array.from(arguments)))
      return consoleOrig.error.apply(this, arguments)
    }

    // intercept unhandled errors
    window.addEventListener('error', function (event) {
      onError(event.message)
    }, true)
    window.addEventListener('unhandledrejection', function (event) {
      onError(errorToString(event.reason))
    }, true)
  }, callbackName)
}

type RegExpRule = { value: boolean, pattern: RegExp }

/** фильтр ошибок загрузки ресурсов */
export type TResourceFilter = {
    /** если url не удовлетворяет регулярному выражению, то ошибка игнорируется */
    url?: RegExpRule[],
}

/** Запускай эту функцию после полной загрузки страницы и затем снова после всех тестов на этой странице */
export async function checkHttpErrors({
  page,
  filters,
}: {
    page: Page,
    filters?: TResourceFilter,
}) {
  const errors = await page.evaluate((filters?: TResourceFilter) => {
    function createRegExpFilter(rules: RegExpRule[]) {
      return function regExpFilter(value: string) {
        let result = false
        for (let i = 0, len = rules.length; i < len; i++) {
          const rule = rules[i]
          if (rule.pattern.test(value)) {
            result = rule.value
          }
        }
        return result
      }
    }

    const regExpFilter = filters && filters.url && createRegExpFilter(filters.url)

    const resources = performance.getEntries && performance.getEntries()
    if (!resources) {
      return null
    }
    return Promise.all(resources.map(resource => {
      if (regExpFilter && !regExpFilter(resource.name)) {
        return null
      }
      return fetch(resource.name, {
        mode: 'no-cors',
      })
        .then(response => {
          if (!response.ok) {
            return {
              url  : resource.name,
              error: response.status + ' ' + response.statusText,
            }
          }
          return null
        })
        .catch(err => {
          return {
            url  : resource.name,
            error: err.message,
          }
        })
    }))
      .then(errors => {
        errors = errors
          .filter(o => o)
        return errors.length > 0
          ? errors
          : null
      })
  }, filters)

  if (errors) {
    console.error('Http errors: ' + JSON.stringify(errors, null, 4))
    throw new Error('Http errors detected')
  }
}

export interface ICheckErrorsController {
    /** Запускай этот метод перед загрузкой сайта на странице */
    subscribeJsErrors(page: Page, onError: TOnError): Promise<void>

    /** Запускай этот метод после полной загрузки страницы и затем снова после всех тестов на этой странице */
    checkHttpErrors(page: Page): Promise<void>
}

/** создаем контроллер для отслеживания ошибок в браузере */
export class CheckErrorsController implements ICheckErrorsController {
  private readonly _jsErrorsFilter?: (error: string) => boolean
  private readonly _httpErrorsFilters?: TResourceFilter

  constructor({
    jsErrorsFilter,
    httpErrorsFilters,
  }: {
        /** фильтр ошибок JavaScript; false = игнорировать ошибку */
        jsErrorsFilter?: (error: string) => boolean,
        /** фильтр ошибок загрузки ресурсов; если url не удовлетворяет регулярному выражению, то ошибка игнорируется */
        httpErrorsFilters?: TResourceFilter,
    }) {
    this._jsErrorsFilter = jsErrorsFilter
    this._httpErrorsFilters = httpErrorsFilters
  }

  /** Запускай этот метод перед загрузкой сайта на странице */
  subscribeJsErrors(page: Page, onError: TOnError) {
    return subscribeJsErrors({
      page,
      filter: this._jsErrorsFilter,
      onError,
    })
  }

  /** Запускай этот метод после полной загрузки страницы и затем снова после всех тестов на этой странице */
  checkHttpErrors(page: Page) {
    return checkHttpErrors({
      page,
      filters: this._httpErrorsFilters,
    })
  }
}
