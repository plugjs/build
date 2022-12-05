import '@plugjs/cov8'
import '@plugjs/eslint'
import '@plugjs/jasmine'
import '@plugjs/typescript'
import {
  build,
  find,
  fixExtensions,
  isDirectory,
  log,
  merge,
  noop,
  rmrf,
} from '@plugjs/plug'

import type { ESBuildOptions, Pipe } from '@plugjs/plug'

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
   * OTHER OPTIONS                                                            *
   * ======================================================================== */

  /** A glob pattern matching all test files (default: `**∕*.test.ts`) */
  testGlob?: string,
  /** Whether to disable tests or not (defailt: `false`) */
  disableTests?: boolean,
  /** Whether to disable code coverage or not (defailt: `false`) */
  disableCoverage?: boolean,
  /** Whether to disable code linting or not (defailt: `false`) */
  disableLint?: boolean,

  /** Minimum overall coverage percentage (default: `100`)  */
  minimumCoverage?: number,
  /** Minimum per-file coverage percentage (default: `100`)  */
  minimumFileCoverage?: number,
  /** Optimal overall coverage percentage (default: _none_)  */
  optimalCoverage?: number,
  /** Optimal per-file coverage percentage (default: _none_)  */
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
    sourceDir = 'src',
    destDir = 'dist',
    testDir = 'test',
    coverageDir = 'coverage',
    coverageDataDir = '.coverage-data',
    extraTypesDir = 'types',

    testGlob = '**/*.test.ts',
    disableTests = false,
    disableCoverage = false,
    disableLint = false,

    minimumCoverage = 100,
    minimumFileCoverage = 100,
    optimalCoverage = undefined,
    optimalFileCoverage = undefined,

    esbuildOptions = {},
  } = options

  // Merge esbuild defaults with specified options
  const esbuildMergedOptions = Object.assign({}, esbuildDefaults, esbuildOptions)

  return build({
    /* ====================================================================== *
     * INITIALIZE REPOSITORY                                                  *
     * ====================================================================== */

    /** Initialize repository */
    async init(): Promise<Pipe> {
      return find('**/*', { directory: '@../resources' })
          .copy('.', { rename: (rel) => rel.replace(/(^|\/)dot_/, '$1.') })
          .debug('Build initialized')
    },

    /* ====================================================================== *
     * SOURCES STRUCTURE                                                      *
     * ====================================================================== */

    /** Find all library source files */
    find_sources(): Pipe {
      return find('**/*.ts', { directory: sourceDir, ignore: '**/*.d.ts' })
    },

    /** Find all types definition files within sources */
    find_types(): Pipe {
      return find('**/*.d.ts', { directory: sourceDir })
    },

    /** Find all types definition files within sources */
    find_extras(): Pipe {
      if (! isDirectory(extraTypesDir)) return noop()
      return find('**/*.d.ts', { directory: extraTypesDir })
    },


    /** Find all resource files (non-typescript files) within sources */
    find_resources(): Pipe {
      return find('**/*', { directory: sourceDir, ignore: '**/*.ts' })
    },

    /** Find all test source files */
    find_tests(): Pipe {
      return find(testGlob, { directory: testDir, ignore: '**/*.d.ts' })
    },

    /* ====================================================================== *
     * TRANSPILE                                                              *
     * ====================================================================== */

    /** Transpile to CJS */
    transpile_cjs(): Pipe {
      return this
          .find_sources()
          .esbuild({
            ...esbuildMergedOptions,
            format: 'cjs',
            outdir: destDir,
            outExtension: { '.js': '.cjs' },
          })
    },

    /** Transpile to ESM */
    transpile_esm(): Pipe {
      return this
          .find_sources()
          .esbuild({
            ...esbuildMergedOptions,
            format: 'esm',
            outdir: destDir,
            outExtension: { '.js': '.mjs' },
          })
    },

    /** Generate all .d.ts files */
    transpile_types(): Pipe {
      return merge([
        this.find_sources(),
        this.find_types(),
        this.find_extras(),
      ]).tsc('tsconfig.json', {
        noEmit: false,
        rootDir: sourceDir,
        declaration: true,
        emitDeclarationOnly: true,
        outDir: destDir,
      })
    },

    /** Copy all resources coming alongside our sources */
    transpile_resources(): Pipe {
      return merge([
        this.find_resources(),
        this.find_types(),
      ]).copy(destDir)
    },

    /** Transpile all source code */
    transpile(): Pipe {
      return merge([
        this.transpile_cjs(),
        this.transpile_esm(),
        this.transpile_types(),
        this.transpile_resources(),
      ])
    },

    /* ====================================================================== *
     * TEST, COVERAGE & LINTING                                               *
     * ====================================================================== */

    /** Run test and emit coverage data */
    async test(): Promise<void> {
      if (disableTests) {
        return void log.warn('Testing disabled')
      }

      if (isDirectory(coverageDataDir)) await rmrf(coverageDataDir)

      await this
          .find_tests()
          .jasmine({ coverageDir: coverageDataDir })
    },

    /** Run tests (always) and generate a coverage report */
    async coverage(): Promise<void> {
      if (disableTests || disableCoverage) {
        return void log.warn('Coverage disabled')
      }

      await this
          .test()
          .finally(() => this.find_sources()
              .coverage(coverageDataDir, {
                reportDir: coverageDir,
                minimumCoverage,
                minimumFileCoverage,
                optimalCoverage,
                optimalFileCoverage,
              }))
    },

    /** Run test and emit coverage data */
    async lint(): Promise<void> {
      if (disableLint) {
        return void log.warn('Linting disabled')
      }

      await merge([
        this.find_sources(),
        this.find_tests(),
        this.find_types(),
        this.find_extras(),
      ]).eslint()
    },

    /* ====================================================================== *
     * DEFAULT: DO EVERYTHING                                                 *
     * ====================================================================== */

    /** Build everything */
    async default(): Promise<void> {
      if (isDirectory(destDir)) await rmrf(destDir)

      await Promise.all([
        this.test(),
        this.coverage(),
        this.lint(),
        this.transpile(),
      ])
    },
  })
}
