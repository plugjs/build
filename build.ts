import { build, tasks } from './src/index'

export default build({
  ...tasks({
    exportsGlob: 'index.*',
  }),
})
