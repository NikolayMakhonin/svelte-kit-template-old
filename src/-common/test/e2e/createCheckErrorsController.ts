// создаем контроллер для ловли ошибок JavaScript и загрузки ресурсов на страницах
import {CheckErrorsController} from 'src/-global/test/e2e/CheckErrorsController'

// функция создает контроллер для отслеживания ошибок в браузере
export function createCheckErrorsController() {
  return new CheckErrorsController({
    // фильтр ошибок JavaScript; false = игнорировать ошибку
    jsErrorsFilter(error) {
      if (/The Link You Followed Has Expired/.test(error)) {
        return false
      }
      return true
    },
    // фильтр ошибок загрузки ресурсов; если url не удовлетворяет регулярному выражению, то ошибка игнорируется
    httpErrorsFilters: {
      url: new RegExp('^' + process.env.HOST.replace(/\/$/, '').replace(/[\\.]/g, '\\$&') + '(\\/|$)'),
    },
  })
}
