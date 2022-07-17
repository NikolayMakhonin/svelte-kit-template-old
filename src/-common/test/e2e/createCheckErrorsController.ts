// создаем контроллер для ловли ошибок JavaScript и загрузки ресурсов на страницах
import {CheckErrorsController} from 'src/-global/test/e2e/CheckErrorsController'

// функция создает контроллер для отслеживания ошибок в браузере
export function createCheckErrorsController({
  host = process.env.HOST,
}: {
  host?: string,
} = {}) {
  return new CheckErrorsController({
    // фильтр ошибок JavaScript; false = игнорировать ошибку
    jsErrorsFilter(error) {
      // if (/The Link You Followed Has Expired/.test(error)) {
      //   return false
      // }
      if (/service-worker.*load failed/.test(error)) {
        return false
      }
      return true
    },
    // фильтр ошибок загрузки ресурсов; если url не удовлетворяет регулярному выражению, то ошибка игнорируется
    httpErrorsFilters: {
      url: [
        { value: true, pattern: new RegExp('^' + host.replace(/\/$/, '').replace(/[\\.]/g, '\\$&') + '(\\/|$)') },
        { value: false, pattern: /\bservice-worker\b/ },
      ],
    },
  })
}
