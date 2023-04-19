import { ts } from '../src/my_ts'
import { idx } from '../src'
import { idx as idx2 } from '../src/my_subpath'

it('ts', () => void expect(ts).toStrictlyEqual('ts'))
it('idx', () => void expect(idx).toStrictlyEqual('index'))
it('my_subpath/index', () => void expect(idx2).toStrictlyEqual('my_subpath/index'))
