import urlJoin from 'url-join'
import {e2eTest} from 'src/-global/test/e2e/e2eTest'
import {getBrowsers} from 'src/-global/test/e2e/browser'
import {createCheckErrorsController} from 'src/-common/test/e2e/createCheckErrorsController'
import { describe, it } from 'vitest'

describe('service-worker', function () {
  // this.timeout(300000)

  it('install and update', async function () {
    const host = 'http://localhost:4173'
    const browsers = getBrowsers()
    const checkErrorsController = createCheckErrorsController({
      host,
    })

    await e2eTest({
      testName       : 'service-worker > install and update',
      browsers,
      screenShotsPath: 'tmp/test/e2e/service-worker/install-and-update',
    }, async ({createContext, onError}) => {
      // открываем новое окно браузера с чистыми куками, как в режиме инкогнито
      const context = await createContext()

      // открываем новую вкладку/страницу
      const page = await context.newPage()

      // запускаем ловлю JS ошибок для страницы page
      await checkErrorsController.subscribeJsErrors(page, onError)

      // загружаем страницу
      await page.goto(urlJoin(host, '/'), {waitUntil: 'networkidle'})

      // проверяем наличие ошибок загрузки ресурсов для страницы page
      await checkErrorsController.checkHttpErrors(page)

      // закрываем анонимное окно браузера со всеми его вкладками
      await context.close()
    })

    console.log('e2e OK')
  })
})
