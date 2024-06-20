import '@plugjs/cov8'
import '@plugjs/eslint'
import '@plugjs/expect5'
import {
  banner,
  find,
  fixExtensions,
  isDirectory,
  merge,
  noop,
  plugjs,
  resolve,
  rmrf,
} from '@plugjs/plug'
import '@plugjs/typescript'

import type { ESBuildOptions, FindOptions, Pipe } from '@plugjs/plug'

export * from '@plugjs/plug'

/** Shared ESBuild options */
const esbuildDefaults: ESBuildOptions = {
  platform: 'node',
  sourcemap: 'linked',
  sourcesContent: false,
  plugins: [ fixExtensions() ],
}

/** Options for creating our shared build file */
export interface TasksOptions {
  /* ======================================================================== *
   * DIRECTORIES                                                              *
   * ======================================================================== */

  /** The directory for the original sources (default: `src`) */
  sourceDir?: string,
  /** The destination directory of the transpiled sources (default: `dist`) */
  destDir?: string,
  /** The directory for the test files (default: `test`) */
  testDir?: string,
  /** The directory for the coverage report (default: `coverage`) */
  coverageDir?: string,
  /** The directory for the coverage data (default: `.coverage-data`) */
  coverageDataDir?: string,
  /** A directory containing extra types to use while transpiling (default: `types`) */
  extraTypesDir?: string,
  /** The `tsconfig.json` file used for _transpiling_ source TypeScript files (default: `tsconfig.json`) */
  tsconfigJson?: string,

  /* ======================================================================== *
   * EXTRA INPUTS                                                             *
   * ======================================================================== */

  /** Extra `find` defintions for additional coverage sources */
  extraCoverage?: (readonly [ glob: string, ...globs: string[], options: FindOptions])[]
  /** Extra `find` defintions for additional linting sources */
  extraLint?: (readonly [ glob: string, ...globs: string[], options: FindOptions])[]

  /* ======================================================================== *
   * PACKAGE.JSON OPTIONS                                                     *
   * ======================================================================== */

  /** The source `package.json` file (default: `package.json`) */
  packageJson?: string,
  /** The source `package.json` file (default: same as `packageJson` option) */
  outputPackageJson?: string,

  /* ======================================================================== *
   * TRANSPILATION OPTIONS                                                    *
   * ======================================================================== */

  /** The extension used for CommonJS modules (default: `.cjs`) */
  cjsExtension?: string,
  /** The extension used for EcmaScript modules (default: `.mjs`) */
  esmExtension?: string,
  /** Enable CommonJS Modules or not (default: `true`) */
  cjs?: boolean,
  /** Enable EcmaScript Modules or not (default: `true`) */
  esm?: boolean,

  /* ======================================================================== *
   * OTHER OPTIONS                                                            *
   * ======================================================================== */

  /** Enable or disable banners (default: `true` if `parallelize` is `false`) */
  banners?: boolean,
  /** Parallelize tasks (might make output confusing, default: `false`) */
  parallelize?: boolean,
  /** A glob pattern matching all test files (default: `**∕*.test.([cm])?ts`) */
  testGlob?: string,
  /** A glob pattern matching files to be exported (default: `index.*`) */
  exportsGlob?: string,
  /** Extra glob patterns matching files to be exported (default: `[]`) */
  exportsGlobs?: string[],
  /** Enable coverage when running tests (default: `true`) */
  coverage?: boolean,
  /** Minimum overall coverage percentage (default: `100`) */
  minimumCoverage?: number,
  /** Minimum per-file coverage percentage (default: `100`) */
  minimumFileCoverage?: number,
  /** Optimal overall coverage percentage (default: _none_) */
  optimalCoverage?: number,
  /** Optimal per-file coverage percentage (default: _none_) */
  optimalFileCoverage?: number,

  /**
   * ESBuild compilation options
   *
   * Default:
   *
   * ```
   * {
   *   platform: 'node',
   *   sourcemap: 'linked',
   *   sourcesContent: false,
   *   plugins: [ fixExtensions() ],
   * }
   * ```
   */
  esbuildOptions?: ESBuildOptions,
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function tasks(options: TasksOptions = {}) {
  const {
    sourceDir: _sourceDir = 'src',
    destDir: _destDir = 'dist',
    testDir: _testDir = 'test',
    coverageDir: _coverageDir = 'coverage',
    coverageDataDir: _coverageDataDir = '.coverage-data',
    extraTypesDir: _extraTypesDir = 'types',
    tsconfigJson: _tsconfigJson = 'tsconfig.json',

    extraLint: _extraLint = [],
    extraCoverage: _extraCoverage = [],

    packageJson: _packageJson = 'package.json',
    outputPackageJson: _outputPackageJson = _packageJson,

    cjsExtension: _cjsExtension = '.cjs',
    esmExtension: _esmExtension = '.mjs',
    cjs: _cjs = true,
    esm: _esm = true,

    parallelize: _parallelize = false,
    banners: _banners = !_parallelize,
    testGlob: _testGlob = '**/*.test.([cm])?ts',
    exportsGlob: _exportsGlob = 'index.*',
    exportsGlobs: _exportsGlobs = [],
    coverage: _coverage = true,
    minimumCoverage: _minimumCoverage = 100,
    minimumFileCoverage: _minimumFileCoverage = 100,
    optimalCoverage: _optimalCoverage = undefined,
    optimalFileCoverage: _optimalFileCoverage = undefined,

    esbuildOptions: _esbuildOptions = {},
  } = options

  // coverage ignore next
  const emitBanner = _banners ? banner : (...args: any) => void args

  // Merge esbuild defaults with specified options
  const esbuildMergedOptions = Object.assign({}, esbuildDefaults, _esbuildOptions)

  return plugjs({
    /** The directory for the original sources (default: `src`) */
    sourceDir: _sourceDir,
    /** The destination directory of the transpiled sources (default: `dist`) */
    destDir: _destDir,
    /** The directory for the test files (default: `test`) */
    testDir: _testDir,
    /** The directory for the coverage report (default: `coverage`) */
    coverageDir: _coverageDir,
    /** The directory for the coverage data (default: `.coverage-data`) */
    coverageDataDir: _coverageDataDir,
    /** A directory containing extra types to use while transpiling (default: `types`) */
    extraTypesDir: _extraTypesDir,
    /** The `tsconfig.json` file used for _transpiling_ source TypeScript files (default: `tsconfig.json`) */
    tsconfigJson: _tsconfigJson,
    /** The source `package.json` file (default: `package.json`) */
    packageJson: _packageJson,
    /** The source `package.json` file (default: same as `packageJson` option) */
    outputPackageJson: _outputPackageJson,
    /** The extension used for CommonJS modules (default: `.cjs`) */
    cjsExtension: _cjsExtension,
    /** The extension used for EcmaScript modules (default: `.mjs`) */
    esmExtension: _esmExtension,
    /** The extension used for CommonJS modules (default: `.cjs`) */
    cjs: _cjs ? 'true' : 'false',
    /** The extension used for EcmaScript modules (default: `.mjs`) */
    esm: _esm ? 'true' : 'false',
    /** A glob pattern matching all test files (default: `**∕*.test.([cm])?ts`) */
    testGlob: _testGlob,
    /** A glob pattern matching files to be exported (default: `index.*`) */
    exportsGlob: _exportsGlob,

    /* ====================================================================== *
     * SOURCES STRUCTURE                                                      *
     * ====================================================================== */

    /** Find all CommonJS source files (`*.cts`) */
    _find_sources_cts(): Pipe {
      return find('**/*.(c)?ts', { directory: this.sourceDir, ignore: '**/*.d.ts' })
    },

    /** Find all EcmaScript Module source files (`*.mts`) */
    _find_sources_mts(): Pipe {
      return find('**/*.(m)?ts', { directory: this.sourceDir, ignore: '**/*.d.ts' })
    },

    /** Find all typescript source files (`*.ts`, `*.mts` and `*.cts`) */
    _find_sources(): Pipe {
      return merge([
        this.cjs === 'true' ? this._find_sources_cts() : noop(),
        this.esm === 'true' ? this._find_sources_mts() : noop(),
      ])
    },

    /** Find all types definition files within sources */
    _find_types(): Pipe {
      return find('**/*.d.([cm])?ts', { directory: this.sourceDir })
    },

    /** Find all resource files (non-typescript files) within sources */
    _find_resources(): Pipe {
      return find('**/*', { directory: this.sourceDir, ignore: '**/*.([cm])?ts' })
    },

    /** Find all test source files */
    _find_tests(): Pipe {
      return find(this.testGlob, { directory: this.testDir, ignore: '**/*.d.([cm])?ts' })
    },

    /** Find all source files to lint */
    _find_lint_sources(): Pipe {
      return merge([
        find('**/*.([cm])?ts', '**/*.([cm])?js', { directory: this.sourceDir }),
        find('**/*.([cm])?ts', '**/*.([cm])?js', { directory: this.testDir }),
        isDirectory(this.extraTypesDir) ?
          find('**/*.([cm])?ts', '**/*.([cm])?js', { directory: this.extraTypesDir }) :
          noop(),
        ..._extraLint.map((args) => find(...args)),
      ])
    },

    /** Find all source files for coverage */
    _find_coverage_sources(): Pipe {
      return merge([
        find('**/*.([cm])?ts', '**/*.([cm])?js', {
          directory: this.sourceDir,
          ignore: '**/*.d.([cm])?ts',
        }),
        ..._extraCoverage.map((args) => find(...args)),
      ])
    },

    /* ====================================================================== *
     * TRANSPILE                                                              *
     * ====================================================================== */

    /** Transpile to CJS */
    transpile_cjs(): Pipe {
      return this._find_sources_cts()
          .esbuild({
            ...esbuildMergedOptions,
            format: 'cjs',
            outdir: this.destDir,
            outExtension: { '.js': this.cjsExtension },
          })
    },

    /** Transpile to ESM */
    transpile_esm(): Pipe {
      return this._find_sources_mts()
          .esbuild({
            ...esbuildMergedOptions,
            format: 'esm',
            outdir: this.destDir,
            outExtension: { '.js': this.esmExtension },
          })
    },

    /** Generate all .d.ts files */
    transpile_types(): Pipe {
      const extraTypesDir =
          isDirectory(this.extraTypesDir) ?
              this.extraTypesDir :
              undefined

      return merge([
        this._find_sources(),
        this._find_types(),
      ]).tsc(this.tsconfigJson, {
        noEmit: false,
        declaration: true,
        emitDeclarationOnly: true,
        outDir: this.destDir,
        extraTypesDir,
      })
    },

    /** Copy all resources coming alongside our sources */
    copy_resources(): Pipe {
      return merge([
        this._find_resources(),
        this._find_types(),
      ]).copy(this.destDir)
    },

    /** Transpile all source code */
    async transpile(): Promise<Pipe> {
      emitBanner('Transpiling source files')

      if (isDirectory(this.destDir)) await rmrf(this.destDir)

      const result = await merge([
        this.cjs === 'true' ? this.transpile_cjs() : noop(),
        this.esm === 'true' ? this.transpile_esm() : noop(),
        this.transpile_types(),
        this.copy_resources(),
      ])

      return result
    },

    /* ====================================================================== *
     * TEST & COVERAGE                                                        *
     * ====================================================================== */

    /** Check test types */
    async test_types(): Promise<void> {
      emitBanner('Checking test types')

      const tsconfig = resolve(this.testDir, 'tsconfig.json')
      const extraTypesDir =
          isDirectory(this.extraTypesDir) ?
              this.extraTypesDir :
              undefined

      await this
          ._find_tests()
          .tsc(tsconfig, {
            noEmit: true,
            declaration: false,
            emitDeclarationOnly: false,
            extraTypesDir,
          })
    },

    /** Run tests */
    async test_cjs(): Promise<void> {
      emitBanner('Running tests (CommonJS)')

      await this
          ._find_tests()
          .test({
            coverageDir: _coverage ? this.coverageDataDir : undefined,
            forceModule: 'commonjs',
          })
    },

    /** Run tests */
    async test_esm(): Promise<void> {
      emitBanner('Running tests (ES Modules)')

      await this
          ._find_tests()
          .test({
            coverageDir: _coverage ? this.coverageDataDir : undefined,
            forceModule: 'module',
          })
    },

    /** Run tests */
    async test(): Promise<void> {
      if (_coverage && isDirectory(this.coverageDataDir)) await rmrf(this.coverageDataDir)

      if (this.cjs === 'true') await this.test_cjs()
      if (this.esm === 'true') await this.test_esm()
    },

    /** Ensure tests have run and generate a coverage report */
    async coverage(): Promise<Pipe> {
      let coveragePipe: Pipe

      // Capture error from running tests, but always produce coverage
      try {
        await this.test()
      } finally {
        emitBanner('Preparing coverage report')

        coveragePipe = this._find_coverage_sources()
            .coverage(this.coverageDataDir, {
              reportDir: this.coverageDir,
              minimumCoverage: _minimumCoverage,
              minimumFileCoverage: _minimumFileCoverage,
              optimalCoverage: _optimalCoverage,
              optimalFileCoverage: _optimalFileCoverage,
            })
      }

      // If the tests didn't throw, return the coverage
      return coveragePipe
    },

    /* ====================================================================== *
     * LINTING                                                                *
     * ====================================================================== */

    /** Lint all sources */
    async lint(): Promise<void> {
      emitBanner('Linting sources')

      await this._find_lint_sources().eslint()
    },

    /* ====================================================================== *
     * PACKAGE.JSON EXPORTS                                                   *
     * ====================================================================== */

    /** Inject `exports` into the `package.json` file */
    async exports(): Promise<Pipe> {
      const files = await this.transpile()

      emitBanner('Updating exports in "package.json"')

      const globs = [ this.exportsGlob, ..._exportsGlobs ] as const

      return merge([ files ])
          .filter(...globs, { directory: this.destDir, ignore: '**/*.map' })
          .exports({
            cjsExtension: this.cjsExtension,
            esmExtension: this.esmExtension,
            packageJson: this.packageJson,
            outputPackageJson: this.outputPackageJson,
          })
    },

    /* ====================================================================== *
     * ALL: DO EVERYTHING                                                     *
     * ====================================================================== */

    /* coverage ignore next */
    /** Build everything. */
    async all(): Promise<void> {
      if (_parallelize) {
        await Promise.all([
          this.transpile(),
          this.test_types(),
          _coverage ? this.coverage() : this.test(),
          this.lint(),
        ])
      } else {
        await this.transpile()
        await this.test_types()
        await (_coverage ? this.coverage() : this.test())
        await this.lint()
      }
    },

    /* ====================================================================== *
     * DEFAULT: DO EVERYTHING                                                 *
     * ====================================================================== */

    /* coverage ignore next */
    /**
     * Default task (simply invokes `this._all()`).
     *
     * Override this and invoke `this._all()` to inject tasks _before_ or
     * _after_ the normal build execution.
     */
    async default(): Promise<void> {
      await this.all()
    },
  })
}
