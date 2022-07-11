import type {BrowserContext} from 'playwright'
import urlJoin from 'url-join'
import {e2eTest} from 'src/-global/test/e2e/e2eTest'
import {getBrowser} from 'src/-global/test/e2e/browser'
import {createCheckErrorsController} from 'src/-common/test/e2e/createCheckErrorsController'

describe('service-worker', function () {
  this.timeout(300000)

  it('install and update', async function () {
    const browser = await getBrowser()
    const checkErrorsController = createCheckErrorsController()
    let context: BrowserContext

    await e2eTest({
      testName       : 'service-worker > install and update',
      getContexts    : () => browser.contexts(),
      screenShotsPath: 'tmp/test/e2e/service-worker/install-and-update',
    }, async (onError) => {
      // открываем новое окно браузера с чистыми куками, как в режиме инкогнито
      const context = await this.browser.newContext()

      // открываем новую вкладку/страницу
      const page = await this._registerContext.newPage()

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
