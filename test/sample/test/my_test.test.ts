import { ts } from '../src/my_ts'
import { idx } from '../src'
import { idx as idx2 } from '../src/my_subpath'

it('ts', () => expect(ts).toStrictlyEqual('ts'))
it('idx', () => expect(idx).toStrictlyEqual('index'))
it('my_subpath/index', () => expect(idx2).toStrictlyEqual('my_subpath/index'))
