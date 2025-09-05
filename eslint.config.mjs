import configurations from '@plugjs/eslint-plugin'

export default [
  ...configurations,

  // ===== DEFINE THE LOCATION OF OUR TSCONFIG.JSON FILES ======================
  {
    name: 'local/options',

    languageOptions: {
      parserOptions: {
        createDefaultProgram: false,
        project: [
          './tsconfig.json',
          './resources/tsconfig.json',
          './resources/test/tsconfig.json',
          './test/tsconfig.json',
        ],
      },
    },
  },

  // ===== ENSURE THAT OUR MAIN FILES DEPEND ONLY ON PROPER DEPENDENCIES =======
  {
    name: 'local/imports',

    files: [ 'src/**' ],
    rules: {
      // Turn _ON_ dependencies checks only for sources
      'import-x/no-extraneous-dependencies': [ 'error', {
        'devDependencies': false,
        'optionalDependencies': false,
        'peerDependencies': true,
        'bundledDependencies': false,
      } ],
    },
  },

  // ===== PROJECT LOCAL RULES =================================================
  // Add any extra rule not tied to a specific "files" pattern here, e.g.:
  // {
  //   name: 'local/rules',
  //
  //   rules: {
  //     'camelcase': 'off',
  //   },
  // },

  // ===== IGNORED FILES =======================================================
  // REMEMBER! Ignores *must* be in its own configuration, they can not coexist
  // with "rules", "languageOptions", "files", ... or anything else (ESLint v9
  // flat config). Otherwise ESLint will blatantly ignore the ignored files!
  {
    name: 'local/ignores',

    ignores: [
      'coverage/',
      'dist/',
      'node_modules/',
      'test/sample/types/extra.d.ts',
    ],
  },
]
