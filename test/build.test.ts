import { join } from 'node:path'

import { $p, find, log, mkdtemp, rmrf } from '@plugjs/plug'

import { tasks } from '../src/build'

describe('PlugJS Shared Build', () => {
  const cwd = process.cwd()

  beforeAll(() => {
    process.chdir(join(cwd, 'test', 'sample'))
  })

  afterAll(() => {
    process.chdir(cwd)
  })


  it('should export a function', () => {
    expect(tasks).toBeInstanceOf(Function)
  })

  it('should transpile all sources', async () => {
    const destDir = mkdtemp()
    log('Transpiling to', $p(destDir))

    try {
      const build = tasks() // destDir as a build prop!
      const transpiled = await build.transpile({ destDir })
      const found = await find('**/*.*', { directory: destDir })

      expect([ ...transpiled ])
          .toEqual(jasmine.arrayWithExactContents([ ...found ]))
      expect([ ...transpiled ])
          .toEqual(jasmine.arrayWithExactContents([
            // plain cjs
            'my_cts.cjs',
            'my_cts.cjs.map',
            'my_cts.d.cts',
            // plain mjs
            'my_mts.mjs',
            'my_mts.mjs.map',
            'my_mts.d.mts',
            // ts transpiled to both cjs and mjs
            'my_ts.cjs',
            'my_ts.cjs.map',
            'my_ts.mjs',
            'my_ts.mjs.map',
            'my_ts.d.ts',
            // dts resource (copied)
            'my_dts.d.ts',
          ]))
    } finally {
      await rmrf(destDir)
    }
  })

  it('should transpile ecmascript modules sources', async () => {
    const destDir = mkdtemp()
    log('Transpiling to', $p(destDir))

    try {
      const build = tasks({ destDir, cjsTranspile: false })
      const transpiled = await build.transpile()
      const found = await find('**/*.*', { directory: destDir })

      expect([ ...transpiled ])
          .toEqual(jasmine.arrayWithExactContents([ ...found ]))
      expect([ ...transpiled ])
          .toEqual(jasmine.arrayWithExactContents([
            // plain mjs
            'my_mts.mjs',
            'my_mts.mjs.map',
            'my_mts.d.mts',
            // ts transpiled to mjs only
            'my_ts.mjs',
            'my_ts.mjs.map',
            'my_ts.d.ts',
            // dts resource (copied)
            'my_dts.d.ts',
          ]))
    } finally {
      await rmrf(destDir)
    }
  })

  it('should transpile commonjs modules sources', async () => {
    const destDir = mkdtemp()
    log('Transpiling to', $p(destDir))

    try {
      const build = tasks({ destDir, esmTranspile: false })
      const transpiled = await build.transpile()
      const found = await find('**/*.*', { directory: destDir })

      expect([ ...transpiled ])
          .toEqual(jasmine.arrayWithExactContents([ ...found ]))
      expect([ ...transpiled ])
          .toEqual(jasmine.arrayWithExactContents([
            // plain cjs
            'my_cts.cjs',
            'my_cts.cjs.map',
            'my_cts.d.cts',
            // ts transpiled cjs only
            'my_ts.cjs',
            'my_ts.cjs.map',
            'my_ts.d.ts',
            // dts resource (copied)
            'my_dts.d.ts',
          ]))
    } finally {
      await rmrf(destDir)
    }
  })

  it('should run some tests', async () => {
    await tasks({ coverage: false }).test()
  })

  it('should lint all our sources', async () => {
    await tasks().lint()
  })

  it('should prepare a coverage report', async () => {
    const tempDir = mkdtemp()
    log('Coverage directory', $p(tempDir))

    try {
      const build = tasks()
      await build.coverage({
        coverageDir: tempDir,
        coverageDataDir: tempDir,
      })

      log(await find('**/*.*', { directory: tempDir }))
    } finally {
      await rmrf(tempDir)
    }
  })
})
