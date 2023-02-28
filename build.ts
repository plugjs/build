import { build, exec, isDirectory, resolve, rmrf, tasks } from './src/index'

export default build({
  ...tasks(),

  /** Run tests */
  async test(): Promise<void> {
    if (isDirectory(this.coverageDataDir)) await rmrf(this.coverageDataDir)

    const [ node, cli ] = process.argv
    const buildFile = resolve('./build.ts')
    const args = [ node!, ...process.execArgv, cli!, '-f', buildFile ] as const

    for (const type of [ 'cjs', 'esm' ]) {
      await exec(...args, `--force-${type}`, `test_${type}`, {
        coverageDir: '.coverage-data',
      })
    }
  },
})
