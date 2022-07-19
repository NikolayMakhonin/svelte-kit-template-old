// создаем контроллер для ловли ошибок JavaScript и загрузки ресурсов на страницах
import {CheckErrorsController, TResourceFilter} from 'src/-global/test/e2e/CheckErrorsController'

// функция создает контроллер для отслеживания ошибок в браузере
export function createCheckErrorsController({
  host = process.env.HOST,
  jsErrorsFilter,
  httpErrorsFilters,
}: {
  host?: string,
  /** фильтр ошибок JavaScript; false = игнорировать ошибку */
  jsErrorsFilter?: (error: string) => boolean,
  /** фильтр ошибок загрузки ресурсов; если url не удовлетворяет регулярному выражению, то ошибка игнорируется */
  httpErrorsFilters?: TResourceFilter,
} = {}) {
  return new CheckErrorsController({
    // фильтр ошибок JavaScript; false = игнорировать ошибку
    jsErrorsFilter(error) {
      if (jsErrorsFilter && !jsErrorsFilter(error)) {
        return false
      }
      // if (/The Link You Followed Has Expired/.test(error)) {
      //   return false
      // }
      if (
        /\bservice-?worker\b/i.test(error)
        && /(load failed|Failed to update)/i.test(error)
      ) {
        return false
      }
      return true
    },
    // фильтр ошибок загрузки ресурсов; если url не удовлетворяет регулярному выражению, то ошибка игнорируется
    httpErrorsFilters: {
      ...httpErrorsFilters || {},
      url: [
        { value: true, pattern: new RegExp('^' + host.replace(/\/$/, '').replace(/[\\.]/g, '\\$&') + '(\\/|$)') },
        { value: false, pattern: /\bservice-worker\b/ },
        ...httpErrorsFilters?.url || [],
      ],
    },
  })
}
