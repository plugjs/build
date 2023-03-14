import { join } from 'node:path'

import { $p, BuildFailure, find, log, mkdtemp, resolve, rmrf } from '@plugjs/plug'
import { readFile } from '@plugjs/plug/fs'

import { tasks } from '../src/index'

describe('PlugJS Shared Build', () => {
  const cwd = process.cwd()
  const banners = false

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
      const build = tasks({ banners }) // destDir as a build prop!
      const transpiled = await build.transpile({ destDir })
      const found = await find('**/*.*', { directory: destDir })

      expect(transpiled.directory).toBe(destDir)

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
            // ts with dual source for cjs and mjs
            'my_xts.cjs',
            'my_xts.cjs.map',
            'my_xts.d.cts',
            'my_xts.mjs',
            'my_xts.mjs.map',
            'my_xts.d.mts',
            // index file
            'index.cjs',
            'index.cjs.map',
            'index.d.ts',
            'index.mjs',
            'index.mjs.map',
            // index file in subpath
            'my_subpath/index.cjs',
            'my_subpath/index.cjs.map',
            'my_subpath/index.d.ts',
            'my_subpath/index.mjs',
            'my_subpath/index.mjs.map',
          ]))
    } finally {
      await rmrf(destDir)
    }
  })

  it('should transpile ecmascript modules sources', async () => {
    const destDir = mkdtemp()
    log('Transpiling to', $p(destDir))

    try {
      const build = tasks({ destDir, cjsTranspile: false, banners })
      const transpiled = await build.transpile()
      const found = await find('**/*.*', { directory: destDir })

      expect(transpiled.directory).toBe(destDir)

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
            // ts with dual source for cjs and mjs
            'my_xts.mjs',
            'my_xts.mjs.map',
            'my_xts.d.mts',
            // index file
            'index.d.ts',
            'index.mjs',
            'index.mjs.map',
            // index file in subpath
            'my_subpath/index.d.ts',
            'my_subpath/index.mjs',
            'my_subpath/index.mjs.map',
          ]))
    } finally {
      await rmrf(destDir)
    }
  })

  it('should transpile commonjs modules sources', async () => {
    const destDir = mkdtemp()
    log('Transpiling to', $p(destDir))

    try {
      const build = tasks({ destDir, esmTranspile: false, banners })
      const transpiled = await build.transpile()
      const found = await find('**/*.*', { directory: destDir })

      expect(transpiled.directory).toBe(destDir)

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
            // ts with dual source for cjs and mjs
            'my_xts.cjs',
            'my_xts.cjs.map',
            'my_xts.d.cts',
            // index file
            'index.cjs',
            'index.cjs.map',
            'index.d.ts',
            // index file in subpath
            'my_subpath/index.cjs',
            'my_subpath/index.cjs.map',
            'my_subpath/index.d.ts',
          ]))
    } finally {
      await rmrf(destDir)
    }
  })

  it('should fail compiling when types are not found', async () => {
    const destDir = mkdtemp()
    log('Transpiling to', $p(destDir))

    try {
      await expectAsync(tasks({ destDir, extraTypesDir: 'no-types', banners }).transpile())
          .toBeRejectedWithError(BuildFailure, '')
    } finally {
      await rmrf(destDir)
    }
  })

  it('should run some tests', async () => {
    await tasks({ coverage: false, banners }).test()
  })

  it('should fail when tests fail', async () => {
    await expectAsync(tasks({ coverage: false, testGlob: '**/*.(test|fail).([cm])?ts', banners }).test())
        .toBeRejectedWithError(BuildFailure, '')
  })

  it('should lint all our sources', async () => {
    await tasks({ banners }).lint()
  }, 30_000)

  it('should prepare a coverage report', async () => {
    const tempDir = mkdtemp()
    log('Coverage directory', $p(tempDir))

    try {
      const coverage = await tasks({ banners }).coverage({
        coverageDir: tempDir,
        coverageDataDir: tempDir,
      })

      const found = await find('**/*.*', { directory: tempDir })

      expect(coverage.directory).toBe(tempDir)
      expect([ ...coverage ]).toEqual([ 'index.html', 'report.js', 'report.json' ])
      expect([ ...found ]).toEqual(jasmine.arrayContaining([ ...coverage ]))
    } finally {
      await rmrf(tempDir)
    }
  })

  it('should prepare a coverage report even when tests fail', async () => {
    const tempDir = mkdtemp()
    log('Coverage directory', $p(tempDir))

    try {
      await expectAsync(tasks({
        minimumCoverage: 0,
        optimalCoverage: 0,
        minimumFileCoverage: 0,
        optimalFileCoverage: 0,
        banners,
      }).coverage({
        testGlob: '**/*.(test|fail).([cm])?ts',
        coverageDir: tempDir,
        coverageDataDir: tempDir,
      })).toBeRejectedWithError(BuildFailure, '')

      expect([ ...await find('**/*.*', { directory: tempDir }) ])
          .toEqual(jasmine.arrayContaining([ 'index.html', 'report.js', 'report.json' ]))
    } finally {
      await rmrf(tempDir)
    }
  })

  it('should prepare a package export list', async () => {
    const destDir = mkdtemp()
    log('Transpiling to', $p(destDir))

    try {
      const outputPackageJson = resolve(destDir, 'package.json')
      const files = await tasks({ banners }).exports({ destDir, outputPackageJson })

      expect([ ...files.absolutePaths() ]).toEqual([ outputPackageJson ])

      const data = JSON.parse(await readFile(outputPackageJson, 'utf8'))
      expect(data).toEqual({
        name: 'a-test-project',
        version: '1.2.3',
        private: true,
        main: './index.cjs',
        module: './index.mjs',
        types: './index.d.ts',
        exports: {
          '.': {
            require: { types: './index.d.ts', default: './index.cjs' },
            import: { types: './index.d.ts', default: './index.mjs' },
          },
        },
      })
    } finally {
      await rmrf(destDir)
    }
  })

  it('should prepare a package export list', async () => {
    const destDir = mkdtemp()
    log('Transpiling to', $p(destDir))

    try {
      const outputPackageJson = resolve(destDir, 'package.json')
      const files = await tasks({ banners }).exports({ destDir, outputPackageJson, exportsGlob: '**/*.*' })

      expect([ ...files.absolutePaths() ]).toEqual([ outputPackageJson ])

      const data = JSON.parse(await readFile(outputPackageJson, 'utf8'))

      expect(data).toEqual({
        name: 'a-test-project',
        version: '1.2.3',
        private: true,
        main: './index.cjs',
        module: './index.mjs',
        types: './index.d.ts',
        exports: {
          '.': {
            require: { types: './index.d.ts', default: './index.cjs' },
            import: { types: './index.d.ts', default: './index.mjs' },
          },
          './my_cts': {
            require: { types: './my_cts.d.cts', default: './my_cts.cjs' },
          },
          './my_mts': {
            import: { types: './my_mts.d.mts', default: './my_mts.mjs' },
          },
          './my_subpath': {
            require: { types: './my_subpath/index.d.ts', default: './my_subpath/index.cjs' },
            import: { types: './my_subpath/index.d.ts', default: './my_subpath/index.mjs' },
          },
          './my_ts': {
            require: { types: './my_ts.d.ts', default: './my_ts.cjs' },
            import: { types: './my_ts.d.ts', default: './my_ts.mjs' },
          },
          './my_xts': {
            require: { types: './my_xts.d.cts', default: './my_xts.cjs' },
            import: { types: './my_xts.d.mts', default: './my_xts.mjs' },
          },
        },
      })
    } finally {
      await rmrf(destDir)
    }
  })

  it('should prepare a package export list for commonjs modules', async () => {
    const destDir = mkdtemp()
    log('Transpiling to', $p(destDir))

    try {
      const outputPackageJson = resolve(destDir, 'package.json')
      const files = await tasks({ esmTranspile: false, banners }).exports({ destDir, outputPackageJson, exportsGlob: '**/*.*' })

      expect([ ...files.absolutePaths() ]).toEqual([ outputPackageJson ])

      const data = JSON.parse(await readFile(outputPackageJson, 'utf8'))

      expect(data).toEqual({
        name: 'a-test-project',
        version: '1.2.3',
        private: true,
        main: './index.cjs',
        types: './index.d.ts',
        exports: {
          '.': {
            require: { types: './index.d.ts', default: './index.cjs' },
          },
          './my_cts': {
            require: { types: './my_cts.d.cts', default: './my_cts.cjs' },
          },
          './my_subpath': {
            require: { types: './my_subpath/index.d.ts', default: './my_subpath/index.cjs' },
          },
          './my_ts': {
            require: { types: './my_ts.d.ts', default: './my_ts.cjs' },
          },
          './my_xts': {
            require: { types: './my_xts.d.cts', default: './my_xts.cjs' },
          },
        },
      })
    } finally {
      await rmrf(destDir)
    }
  })

  it('should prepare a package export list for ecmascript modules', async () => {
    const destDir = mkdtemp()
    log('Transpiling to', $p(destDir))

    try {
      const outputPackageJson = resolve(destDir, 'package.json')
      const files = await tasks({ cjsTranspile: false, banners }).exports({ destDir, outputPackageJson, exportsGlob: '**/*.*' })

      expect([ ...files.absolutePaths() ]).toEqual([ outputPackageJson ])

      const data = JSON.parse(await readFile(outputPackageJson, 'utf8'))

      expect(data).toEqual({
        name: 'a-test-project',
        version: '1.2.3',
        private: true,
        module: './index.mjs',
        types: './index.d.ts',
        exports: {
          '.': {
            import: { types: './index.d.ts', default: './index.mjs' },
          },
          './my_mts': {
            import: { types: './my_mts.d.mts', default: './my_mts.mjs' },
          },
          './my_subpath': {
            import: { types: './my_subpath/index.d.ts', default: './my_subpath/index.mjs' },
          },
          './my_ts': {
            import: { types: './my_ts.d.ts', default: './my_ts.mjs' },
          },
          './my_xts': {
            import: { types: './my_xts.d.mts', default: './my_xts.mjs' },
          },
        },
      })
    } finally {
      await rmrf(destDir)
    }
  })
})
