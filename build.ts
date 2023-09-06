import { build, find, logging, merge, tasks } from './src/index'

import type { Pipe } from './src/index'

logging.logOptions.githubAnnotations = false

export default build({
  ...tasks({ testGlob: '*.test.ts' }),

  /** Override, as we want to ignore the whole test's `sample` directory */
  _find_lint_sources(): Pipe {
    return merge([
      find('**/*.([cm])?ts', '**/*.([cm])?js', { directory: this.sourceDir }),
      find('**/*.([cm])?ts', '**/*.([cm])?js', {
        directory: this.testDir,
        ignore: 'sample/**/*.*',
      }),
    ])
  },
})
