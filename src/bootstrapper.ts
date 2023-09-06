import { find, fs, isFile, log, plugjs, resolve } from '@plugjs/plug'
import { $p } from '@plugjs/plug/logging'

function sortByKey<T extends Record<string, any>>(unsorted: T): T {
  return Object.keys(unsorted).sort().reduce((obj, key: keyof T) => {
    obj[key] = unsorted[key]
    return obj
  }, {} as T)
}

export const tasks = plugjs({
  overwrite: 'skip',

  /** Copy all resources from the `resources/` directory into the target */
  async resources(): Promise<void> {
    const pipe = find('**/*', '**/.*', { directory: '@../resources' })
    const sources = await pipe
    const targets = await pipe.copy('.', {
      // it seems NPM has _some_ problems with some dotfiles (e.g. .gitignore)
      rename: (relative) => relative.replaceAll(/(^|\/)__dot_/g, '$1.'),
      overwrite: this.overwrite as 'skip' | 'overwrite',
    })

    log('Bootstrapped', targets.length, 'of', sources.length, 'files:')
    for (const file of targets.absolutePaths()) log(`    ${$p(file)}`)
  },

  /** Setup dependencies and build script into target `package.json` */
  async packages(): Promise<void> {
    // Read the "package.json" of "@plugjs/build"
    const buildPackage = resolve('@../package.json')
    log(`Reading ${$p(buildPackage)}`)
    const buildData = await fs.readFile(buildPackage, 'utf-8')
    const buildJson = JSON.parse(buildData)

    // Read the "package.json" in the current directory (if any)
    const targetJson: Record<string, any> = {}
    const targetPackage = resolve('./package.json')
    if (isFile(targetPackage)) {
      log(`Reading ${$p(targetPackage)}`)
      const targetData = await fs.readFile(targetPackage, 'utf-8')
      Object.assign(targetJson, JSON.parse(targetData))
    }

    // Merge package contents
    log(`Updating ${$p(targetPackage)}`)

    // Default scripts
    targetJson.scripts = sortByKey({
      build: 'plug',
      coverage: 'plug coverage',
      dev: 'plug coverage -w src -w test',
      lint: 'plug lint',
      test: 'plug test',
      transpile: 'plug transpile',
      ...targetJson.scripts,
    })

    // Exported/packaged files
    const targetFiles = new Set([ ...(targetJson.files || []), '*.md', 'dist/', 'src/' ])
    targetJson.files = [ ...targetFiles ].sort()

    // *DEV* dependency on this build
    targetJson.devDependencies = sortByKey({
      ...targetJson.devDependencies,
      [buildJson.name]: `^${buildJson.version}`,
    })

    // Overwrite taget package.json file
    log(`Writing ${$p(targetPackage)}`)
    await fs.writeFile(targetPackage, JSON.stringify(targetJson, null, 2) + '\n', 'utf-8')
  },

  /** Bootstrap the project */
  async bootstrap(): Promise<void> {
    log(`Boostrapping PlugJS Build from ${$p(resolve('@'))}`)
    await this.resources()
    await this.packages()
  },
})
