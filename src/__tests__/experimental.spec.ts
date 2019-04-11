/**
 * @author Dino <dinoabsoluto+dev@gmail.com>
 * @license
 * flex-progress-js - Progress indicator for Node.js
 * Copyright (C) 2019 Dino <dinoabsoluto+dev@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */
/* imports */
import once from 'lodash-es/once'

/* code */
// █████▒░░░░░░░░░
// ██████▓░░░░░░░░
// █████████████▓░
// █▓▒░▒▓█

abstract class ElementNext<T extends object, K extends keyof T> {
  constructor (data: T) {
    this.pData = data
    this.proxy = new Proxy(this.pData, {
      get: ($, prop: K) => {
        const { pUpdate } = this
        if (pUpdate[prop] !== undefined) {
          return pUpdate[prop]
        } else {
          return $[prop]
        }
      },
      set: (_$, prop: K, value: any) => {
        this.pUpdate[prop] = value
        this.pSchedule()
        return true
      }
    })
  }
  protected proxy: T
  protected schedule = setImmediate
  private pData: T
  private pUpdate: Partial<T> = {}
  private pSchedule = once(() => {
    this.schedule(this.pFlush)
  })

  private pFlush = () => {
    let data: Partial<T>
    ;[ data, this.pUpdate ] = [ this.pUpdate, {} ]
    this.handleFlush(data)
    Object.assign(this.pData, data)
    this.count++
    this.pSchedule = once(() => {
      this.schedule(this.pFlush)
    })
  }

  protected abstract handleFlush (data: Partial<T>): void

  count = 0
}

const immediate = () => {
  return new Promise(resolve => setImmediate(resolve))
}

describe('ElementNext', () => {
  test('simple', async () => {
    class TestE<T extends object, K extends keyof T> extends ElementNext<T, K> {
      tProxy = this.proxy
      handleFlush () {
        return
      }
    }
    const node = new TestE({
      a: 0,
      b: 1,
      c: 2
    })
    expect(node.count).toBe(0)
    expect(node.tProxy).toMatchObject({
      a: 0,
      b: 1,
      c: 2
    })
    node.tProxy.a += 10
    node.tProxy.b += 10
    node.tProxy.c += 10
    expect(node.tProxy).toMatchObject({
      a: 10,
      b: 11,
      c: 12
    })
    expect(node.count).toBe(0)
    await immediate()
    expect(node.count).toBe(1)
  })
})
