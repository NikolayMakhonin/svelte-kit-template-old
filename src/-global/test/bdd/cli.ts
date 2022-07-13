import yargs from 'yargs'
import {runTests} from './runTests'
import dotenv from 'dotenv'
dotenv.config()

export async function run() {
  const argv = await yargs(process.argv)
    .option('watch', {
      alias      : 'w',
      type       : 'boolean',
      description: 'Watch files in the current working directory for changes',
      'default'  : false,
    })
    .option('timeout', {
      alias      : 't',
      type       : 'number',
      description: 'Specify test timeout threshold (in milliseconds)',
      'default'  : 2000,
    })
    .option('reporter', {
      alias      : 'R',
      type       : 'string',
      description: 'Specify reporter to use',
    })
    .option('grep', {
      alias      : 'g',
      type       : 'string',
      description: 'Only run tests matching this string or regexp',
      'default'  : null,
    })
    .argv

  const {
    watch,
    timeout,
    reporter: reporterPath,
    grep,
    _: [,, ...filesGlobs],
  } = argv

  runTests({
    watch,
    timeout,
    reporterPath,
    filesGlobs: filesGlobs as string[],
    grep      : grep && new RegExp(grep),
  })
}

void run()
