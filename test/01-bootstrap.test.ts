import {
  banner,
  exec,
  find,
  invokeBuild,
  mkdtemp,
  parseJson,
  resolve,
  rmrf,
} from '@plugjs/plug'
import { writeFile } from '@plugjs/plug/fs'

import { tasks } from '../src/bootstrapper'

describe('Boostrap', () => {
  it('should bootstrap a directory', async () => {
    const currentRoot = resolve('.')
    const tempDir = mkdtemp()

    // we need a package for the installation
    log.warn('>>> Packing...')
    await exec('npm', 'pack', '--quiet', '--pack-destination', currentRoot)

    const pkg = parseJson(resolve('package.json'))
    const tgz = resolve(currentRoot, `plugjs-build-${pkg.version}.tgz`)

    // write a very simple (empty) package.json file
    await writeFile(resolve(tempDir, 'package.json'), '{}')

    // go into the temporary directory and bootstrap
    const dir = process.cwd()
    try {
      process.chdir(tempDir)
      banner('Running boostrap...')
      // once for coverage
      await tasks.bootstrap({ overwrite: 'skip' })
      // once to check the scripts work
      await exec('npx', '--yes', '--package', tgz, 'bootstrap-plugjs-build')

      banner('Installing...')
      await exec('npm', 'install', '--quiet', tgz)

      banner('Building...')
      await invokeBuild(resolve(tempDir, 'build.ts'))

      banner('Checking...')
      const files = await find('**/*.*', { directory: tempDir })
      expect([ ...files ]).toInclude([
        // coverage data
        'coverage/index.html',
        'coverage/report.js',
        'coverage/report.json',
        // generated files
        'dist/index.cjs',
        'dist/index.cjs.map',
        'dist/index.d.ts',
        'dist/index.mjs',
        'dist/index.mjs.map',
      ])
    } finally {
      process.chdir(dir)
      await rmrf(tempDir)
    }
  }, 120_000)
})
