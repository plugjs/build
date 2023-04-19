import { cts } from '../src/my_cts.cjs'
import { xts } from '../src/my_xts.cjs'

it('cts', () => expect(cts).toStrictlyEqual('cts'))
it('xts', () => expect(xts).toStrictlyEqual('cts'))
