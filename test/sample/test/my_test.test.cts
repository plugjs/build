import { cts } from '../src/my_cts.cjs'
import { xts } from '../src/my_xts.cjs'

it('cts', () => void expect(cts).toStrictlyEqual('cts'))
it('xts', () => void expect(xts).toStrictlyEqual('cts'))
