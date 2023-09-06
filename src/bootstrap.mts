#!/usr/bin/env node
/* coverage ignore file */

import { log } from '@plugjs/plug'

import { tasks } from './bootstrapper'

const overwrite = process.argv[2] === '--overwrite' ? 'overwrite' : 'skip'
tasks.bootstrap({ overwrite }).catch(log.error)
