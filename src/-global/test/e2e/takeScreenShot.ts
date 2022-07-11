import type {BrowserContext} from 'playwright'
import path from 'path'

/** функция делает скриншоты всех окон браузера и сохраняет их в outputPath/<текущая дата> */
export async function takeScreenShotFromContext({
  context,
  contextsIndex = 0,
  contextIndex = 0,
  outputPath,
}: {
    context: BrowserContext,
    contextsIndex?: number,
    contextIndex?: number,
    outputPath: string,
}) {
  const now = new Date()
  return Promise.all(context.pages().map((page, pageIndex) => {
    return page.screenshot({
      type    : 'jpeg',
      fullPage: true,
      path    : path.join(
        outputPath,
        now.toISOString().replace(/T/g, '_').replace(/:/g, '-').replace(/Z/g, '')
                + `_${contextsIndex}_${contextIndex}_${pageIndex}.jpg`,
      ),
    })
  }))
}

/** функция делает скриншоты всех окон браузера и сохраняет их в outputPath/<текущая дата> */
export async function takeScreenShotFromContexts({
  contexts,
  contextsIndex = 0,
  outputPath,
}: {
    contexts: BrowserContext[],
    contextsIndex?: number,
    outputPath: string,
}) {
  await Promise.all(contexts
    .map((context, contextIndex) => takeScreenShotFromContext({
      context,
      contextsIndex,
      contextIndex,
      outputPath,
    })))
}
