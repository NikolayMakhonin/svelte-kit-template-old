import {ChildProcess, spawn, SpawnOptionsWithoutStdio} from 'child_process'
import {removeConsoleColor} from './helpers/removeConsoleColor'

export class Proc {
  readonly command: string
  readonly proc: ChildProcess
  readonly logPrefix: string

  constructor(command: string, options?: SpawnOptionsWithoutStdio) {
    this.proc = spawn(command, {
      shell: true,
      env  : {
        NODE_ENV: 'development',
      },
      ...options,
    })

    this.logPrefix = `${command} (${this.proc.pid}): `
    console.log(this.logPrefix + 'run')

    void this.wait().catch(() => {
    })
  }

  wait<T = void>(callback?: (args: {
    resolve: (value: T) => void,
    reject: (err: any) => void,
    data: string,
  }) => void) {
    return new Promise<T>((resolve, reject) => {
      const _this = this

      function unsubscribe() {
        _this.proc.stdout.off('data', onStdOut)
        _this.proc.stderr.off('data', onStdErr)
        _this.proc.off('exit', onExit)
        _this.proc.off('error', onError)
      }

      function _resolve(value: T) {
        unsubscribe()
        console.log(_this.logPrefix + 'resolve')
        resolve(value)
      }

      function _reject(err: any) {
        unsubscribe()
        reject(err)
      }

      function onData(data: Buffer, stderr: boolean) {
        let text = data.toString('utf8')

        if (stderr) {
          console.log(_this.logPrefix + text)
        }
        else {
          console.warn(_this.logPrefix + text)
        }

        text = removeConsoleColor(text)

        if (callback) {
          callback.call(_this, {resolve: _resolve, reject: _reject, data: text})
          return
        }
      }

      function onStdOut(data: Buffer) {
        onData(data, false)
      }

      function onStdErr(data: Buffer) {
        onData(data, false)
      }

      function onExit(code: number) {
        if (code) {
          const message = _this.logPrefix + `exit code ${code}`
          console.error(message)
          reject(new Error(message))
          // assert.fail(message)
          return
        }
        _resolve(void 0)
        console.log(_this.logPrefix + 'exit')
      }

      function onError(err: Error) {
        const message = _this.logPrefix + `error ${err?.stack || err}`
        console.error(message)
        reject(err)
        assert.fail(message)
      }

      _this.proc.stdout.on('data', onStdOut)
      _this.proc.stderr.on('data', onStdErr)
      _this.proc.on('exit', onExit)
      _this.proc.on('error', onError)
    })
  }

  // get isAlive() {
  //   return this.proc.signalCode == null && this.proc.exitCode == null
  // }
  //
  // // It doesn't work time to time, don't use it
  // async kill() {
  //   assert.ok(this.isAlive, this.logPrefix + 'Process already killed')
  //
  //   try {
  //     // this.proc.kill('SIGKILL')
  //     await fkill(this.proc.pid, {
  //       force            : true,
  //       forceAfterTimeout: 30000,
  //       // tree             : true,
  //     })
  //   }
  //   catch (err) {
  //     console.warn(err.message)
  //   }
  //
  //   // console.log(JSON.stringify({
  //   //   killed    : this.proc.killed,
  //   //   signalCode: this.proc.signalCode,
  //   //   exitCode  : this.proc.exitCode,
  //   //   connected : this.proc.connected,
  //   // }, null, 2))
  //
  //   assert.ok(!this.isAlive, this.logPrefix + 'Process kill failed')
  // }
}
