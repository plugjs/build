import configurations from '@plugjs/eslint-plugin'

export default [
  ...configurations,

  // ===== DEFINE THE LOCATION OF OUR TSCONFIG.JSON FILES ======================
  {
    files: [ '**/*.ts', '**/*.cts', '**/*.mts' ],
    languageOptions: {
      parserOptions: {
        createDefaultProgram: false,
        project: [
          './tsconfig.json',
          './test/tsconfig.json',
        ],
      },
    },
  },

  // ===== ENSURE THAT OUR MAIN FILES DEPEND ONLY ON PROPER DEPENDENCIES =======
  {
    files: [ 'src/**' ],
    rules: {
      // Turn _ON_ dependencies checks only for sources
      'import-x/no-extraneous-dependencies': [ 'error', {
        'devDependencies': true,
        'peerDependencies': true,
        'optionalDependencies': true,
        'bundledDependencies': false,
      } ],
    },
  },

  // ===== ENSURE THAT OUR MAIN FILES DEPEND ONLY ON PROPER DEPENDENCIES =======
  {
    ignores: [
      'coverage/',
      'dist/',
      'node_modules/',
    ],
  },
]
