import { mts } from '../src/my_mts.mjs'
import { xts } from '../src/my_xts.mjs'

it('mts', () => expect(mts).toStrictlyEqual('mts'))
it('xts', () => expect(xts).toStrictlyEqual('mts'))
