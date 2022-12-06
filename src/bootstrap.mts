#!/usr/bin/env node
import { build, find, invoke, log, resolve, fs, isFile } from '@plugjs/plug'
import { $p } from '@plugjs/plug/logging'

const tasks = build({
  /** Copy all resources from the `resources/` directory into the target */
  async bootstrap_resources(): Promise<void> {
    const pipe = find('**/*', '**/.*', { directory: '@../resources' })
    const sources = await pipe
    const targets = await pipe.copy('.', { overwrite })

    log('Bootstrapped', targets.length, 'of', sources.length, 'files:')
    for (const file of targets.absolutePaths()) log(`    ${$p(file)}`)
  },

  /** Setup dependencies and build script into target `package.json` */
  async bootstrap_package(): Promise<void> {
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

    if (! targetJson.scripts?.build) {
      targetJson.scripts = Object.assign({}, targetJson.scripts, {
        build: 'plug',
      })
    }

    targetJson.devDependencies = Object.assign({}, targetJson.devDependencies, {
      [buildJson.name]: `^${buildJson.version}`,
    })

    // Overwrite taget package.json file
    log(`Writing ${$p(targetPackage)}`)
    await fs.writeFile(targetPackage, JSON.stringify(targetJson, null, 2), 'utf-8')
  },

  /** Bootstrap the project */
  async bootstrap(): Promise<void> {
    log(`Boostrapping PlugJS Build from ${$p(resolve('@'))}`)
    await this.bootstrap_resources()
    await this.bootstrap_package()
  },
})

const overwrite = process.argv[2] === '--overwrite' ? 'overwrite' : 'skip'
invoke(tasks, 'bootstrap', { overwrite }).catch(log.error)
