import { tasks, logging } from './src/index'

logging.logOptions.githubAnnotations = false

export default tasks({ testGlob: 'build.test.ts' })
