import { ts } from '../src/my_ts'
import { idx } from '../src'
import { idx as idx2 } from '../src/my_subpath'

it('ts', () => expect(ts).toBe('ts'))
it('idx', () => expect(idx).toBe('index'))
it('my_subpath/index', () => expect(idx2).toBe('my_subpath/index'))
