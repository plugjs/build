import '@plugjs/cov8'
import '@plugjs/eslint'
import '@plugjs/jasmine'
import {
  $gry,
  $wht,
  build,
  find,
  fixExtensions,
  isDirectory, log, merge,
  noop,
  rmrf,
} from '@plugjs/plug'
import '@plugjs/typescript'

import type { ESBuildOptions, Files, Pipe } from '@plugjs/plug'

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
  /** Enable CommonJS Modules transpilation or not (default: `true`) */
  cjsTranspile?: boolean,
  /** Enable EcmaScript Modules transpilation or not (default: `true`) */
  esmTranspile?: boolean,

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

    packageJson: _packageJson = 'package.json',
    outputPackageJson: _outputPackageJson = _packageJson,

    cjsExtension: _cjsExtension = '.cjs',
    esmExtension: _esmExtension = '.mjs',
    cjsTranspile: _cjsTranspile = true,
    esmTranspile: _esmTranspile = true,

    parallelize: _parallelize = false,
    banners: _banners = !_parallelize,
    testGlob: _testGlob = '**/*.test.([cm])?ts',
    exportsGlob: _exportsGlob = 'index.*',
    coverage: _coverage = true,
    minimumCoverage: _minimumCoverage = 100,
    minimumFileCoverage: _minimumFileCoverage = 100,
    optimalCoverage: _optimalCoverage = undefined,
    optimalFileCoverage: _optimalFileCoverage = undefined,

    esbuildOptions: _esbuildOptions = {},
  } = options

  // coverage ignore next
  const banner = _banners ? emitBanner : (...args: any) => void args

  // Merge esbuild defaults with specified options
  const esbuildMergedOptions = Object.assign({}, esbuildDefaults, _esbuildOptions)

  return build({
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
    /** The source `package.json` file (default: `package.json`) */
    packageJson: _packageJson,
    /** The source `package.json` file (default: same as `packageJson` option) */
    outputPackageJson: _outputPackageJson,
    /** The extension used for CommonJS modules (default: `.cjs`) */
    cjsExtension: _cjsExtension,
    /** The extension used for EcmaScript modules (default: `.mjs`) */
    esmExtension: _esmExtension,
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
        _cjsTranspile ? this._find_sources_cts() : noop(),
        _esmTranspile ? this._find_sources_mts() : noop(),
      ])
    },

    /** Find all types definition files within sources */
    _find_types(): Pipe {
      return find('**/*.d.ts', { directory: this.sourceDir })
    },

    /** Find all types definition files within sources */
    _find_extras(): Pipe {
      if (! isDirectory(this.extraTypesDir)) return noop()
      return find('**/*.d.ts', { directory: this.extraTypesDir })
    },


    /** Find all resource files (non-typescript files) within sources */
    _find_resources(): Pipe {
      return find('**/*', { directory: this.sourceDir, ignore: '**/*.([cm])?ts' })
    },

    /** Find all test source files */
    _find_tests(): Pipe {
      return find(this.testGlob, { directory: this.testDir, ignore: '**/*.d.ts' })
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
      return merge([
        this._find_sources(),
        this._find_types(),
        this._find_extras(),
      ]).tsc('tsconfig.json', {
        noEmit: false,
        rootDir: this.sourceDir,
        declaration: true,
        emitDeclarationOnly: true,
        outDir: this.destDir,
      })
    },

    /** Copy all resources coming alongside our sources */
    transpile_resources(): Pipe {
      return merge([
        this._find_resources(),
        this._find_types(),
      ]).copy(this.destDir)
    },

    /** Transpile all source code */
    async transpile(): Promise<Pipe> {
      banner('Transpiling source files')

      if (isDirectory(this.destDir)) await rmrf(this.destDir)

      return merge([
        _cjsTranspile ? this.transpile_cjs() : noop(),
        _esmTranspile ? this.transpile_esm() : noop(),
        this.transpile_types(),
        this.transpile_resources(),
      ])
    },

    /* ====================================================================== *
     * TEST, COVERAGE & LINTING                                               *
     * ====================================================================== */

    /** Run test and emit coverage data */
    async test(): Promise<void> {
      banner('Running tests')

      if (_coverage && isDirectory(this.coverageDataDir)) await rmrf(this.coverageDataDir)

      await this
          ._find_tests()
          .jasmine({ coverageDir: _coverage ? this.coverageDataDir : undefined })
    },

    /** Run tests (always) and generate a coverage report */
    async coverage(): Promise<Pipe> {
      // Capture error from running tests, but always produce coverage
      let files: Files
      try {
        await this.test()
      } finally {
        banner('Preparing coverage report')
        files = await this
            ._find_sources()
            .coverage(this.coverageDataDir, {
              reportDir: this.coverageDir,
              minimumCoverage: _minimumCoverage,
              minimumFileCoverage: _minimumFileCoverage,
              optimalCoverage: _optimalCoverage,
              optimalFileCoverage: _optimalFileCoverage,
            })
      }

      // No exceptions!
      return files
    },

    /** Run test and emit coverage data */
    async lint(): Promise<void> {
      banner('Linting sources')

      await merge([
        this._find_sources(),
        this._find_tests(),
        this._find_types(),
        this._find_extras(),
      ]).eslint()
    },

    /* ====================================================================== *
     * PACKAGE.JSON EXPORTS                                                   *
     * ====================================================================== */

    /** Inject `exports` into the `package.json` file */
    async exports(): Promise<Pipe> {
      const files = await this.transpile()

      banner('Updating exports in "package.json"')

      return merge([ files ])
          .filter(this.exportsGlob, { directory: this.destDir, ignore: '**/*.map' })
          .exports({
            cjsExtension: this.cjsExtension,
            esmExtension: this.esmExtension,
            packageJson: this.packageJson,
            outputPackageJson: this.outputPackageJson,
          })
    },

    /* ====================================================================== *
     * DEFAULT: DO EVERYTHING                                                 *
     * ====================================================================== */

    /* coverage ignore next */
    /** Build everything */
    async default(): Promise<void> {
      if (_parallelize) {
        await Promise.all([
          this.coverage(), // implies "test"
          this.lint(),
          this.transpile(),
        ])
      } else {
        await this.coverage() // implies "test"
        await this.lint()
        await this.transpile()
      }
      await this.exports()
    },
  })
}

/* coverage ignore next */
/* Leave this at the _end_ of the file, unicode messes up sitemaps... */
function emitBanner(message: string): void {
  log.notice([
    '', $gry(`\u2554${''.padStart(60, '\u2550')}\u2557`),
    `${$gry('\u2551')} ${$wht(message.padEnd(58, ' '))} ${$gry('\u2551')}`,
    $gry(`\u255A${''.padStart(60, '\u2550')}\u255D`), '',
  ].join('\n'))
}
