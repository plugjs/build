import { mts } from '../src/my_mts.mjs'
import { xts } from '../src/my_xts.mjs'

it('mts', () => void expect(mts).toStrictlyEqual('mts'))
it('xts', () => void expect(xts).toStrictlyEqual('mts'))
