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
import { Text } from '../text'
import { Group } from '../group'

/* code */
// █████▒░░░░░░░░░
// ██████▓░░░░░░░░
// █████████████▓░
// █▓▒░▒▓█
describe('Group', () => {
  test('flex.1', async () => {
    const group = new Group()
    const text = new Text({ text: 'a'.repeat(25), flex: 1 })
    group.append('abc')
    group.append(text)
    expect(group.render(20)).toBe('abc' + 'a'.repeat(16) + '…')
    const group2 = new Group()
    group2.append(group)
    expect(group2.render(20)).toBe('abc' + 'a'.repeat(16) + '…')
  })
  test('flex.2', async () => {
    const group = new Group()
    const group2 = new Group()
    group2.append(group)
    const text = new Text({ text: 'a'.repeat(25), flex: 1 })
    group.append('abc')
    group.append(text)
    expect(group.render(20)).toBe('abc' + 'a'.repeat(16) + '…')
    expect(group2.render(20)).toBe('abc' + 'a'.repeat(16) + '…')
  })
  test('add/remove', async () => {
    const group = new Group()
    group.add('ABC')
    group.add(1)
    group.add('#')
    expect(group.render()).toBe('ABC #')
    group.remove(group.children[1])
    expect(group.render()).toBe('ABC#')
    group.remove(group.children[1])
    expect(group.render()).toBe('ABC')
    const item = new Text('#')
    expect(group.remove(item)).toBe(undefined)
    group.append(item)
    expect(group.render()).toBe('ABC#')
    expect(group.remove(item)).toBe(item)
    group.add(item, 0)
    expect(group.render()).toBe('#ABC')
    group.clear()
    expect(group.children.length).toBe(0)
  })
  test('timing', () => {
    const group = new Group()
    expect(group.nextFrame(() => undefined)).toBe(false)
    const parent = new Group()
    parent.add(group)
    const mockFn = jest.fn(parent.nextFrame)
    const mockNotify = jest.fn(parent.notify)
    parent.nextFrame = mockFn
    parent.notify = mockNotify
    expect(group.nextFrame(() => undefined)).toBe(false)
    expect(mockFn.mock.calls.length).toBe(1)
    group.notify()
    expect(mockNotify.mock.calls.length).toBe(1)
  })
})
