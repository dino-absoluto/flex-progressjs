/**
 * @author Dino <dinoabsoluto+dev@gmail.com>
 * @license
 * Copyright 2019 Dino <dinoabsoluto+dev@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/* imports */
import sortedIndex = require('lodash/sortedIndex')
import sortedLastIndex = require('lodash/sortedLastIndex')

/* code */
// █████▒░░░░░░░░░
// ██████▓░░░░░░░░
// █████████████▓░
// █▓▒░▒▓█

class SortedWrapper<T> {
  public id: number
  public item: T
  public constructor (id: number, item: T) {
    this.id = id
    this.item = item
  }

  public [Symbol.toPrimitive] (): number {
    return this.id
  }
}

export class SortedItems<T> {
  private $data: SortedWrapper<T>[] = []

  public indexOf (id: number, item: T): number {
    const { $data } = this
    const wrapper = new SortedWrapper(id, item)
    const index = sortedIndex($data, wrapper)
    const last = sortedLastIndex($data, wrapper)
    for (let i = index; i < last; ++i) {
      if ($data[i].item === item) {
        return i
      }
    }
    return -1
  }

  public add (id: number, item: T): this {
    const { $data } = this
    const wrapper = new SortedWrapper(id, item)
    const index = sortedIndex($data, wrapper)
    $data.splice(index, 0, wrapper)
    return this
  }

  public remove (id: number, item: T): T {
    const { $data } = this
    const index = this.indexOf(id, item)
    if (index >= 0) {
      $data.splice(index, 1)
      return item
    }
    return item
  }

  public get length (): number { return this.$data.length }
  public clear (): void {
    this.$data.length = 0
  }

  public values (): IterableIterator<SortedWrapper<T>> {
    return (function * ($data): IterableIterator<SortedWrapper<T>> {
      for (const item of $data) {
        yield item
      }
    })(this.$data)
  }

  public valuesRight (): IterableIterator<SortedWrapper<T>> {
    return (function * ($data): IterableIterator<SortedWrapper<T>> {
      const length = $data.length
      for (let i = length - 1; i >= 0; --i) {
        yield $data[i]
      }
    })(this.$data)
  }
}
