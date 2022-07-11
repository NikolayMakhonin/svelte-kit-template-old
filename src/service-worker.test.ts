import type {BrowserContext} from 'playwright'
import urlJoin from 'url-join'
import {e2eTest} from 'src/-global/test/e2e/e2eTest'
import {getBrowsers} from 'src/-global/test/e2e/browser'
import {createCheckErrorsController} from 'src/-common/test/e2e/createCheckErrorsController'

describe('service-worker', function () {
  it('install and update', async function () {
    const browsers = getBrowsers()
    const checkErrorsController = createCheckErrorsController()

    await e2eTest({
      testName       : 'service-worker > install and update',
      browsers,
      screenShotsPath: 'tmp/test/e2e/service-worker/install-and-update',
    }, async (browser, onError) => {
      // открываем новое окно браузера с чистыми куками, как в режиме инкогнито
      const context = await this.browser.newContext()

      // открываем новую вкладку/страницу
      const page = await context.newPage()

      // запускаем ловлю JS ошибок для страницы page
      await checkErrorsController.subscribeJsErrors(page, onError)

      // загружаем страницу
      await page.goto(urlJoin(process.env.HOST, '/'), {waitUntil: 'networkidle'})

      // проверяем наличие ошибок загрузки ресурсов для страницы page
      await checkErrorsController.checkHttpErrors(page)

      // закрываем анонимное окно браузера со всеми его вкладками
      await context.close()
    })

    console.log('OK')
  })
})
