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
import stringWidth from '../optional/string-width'

export interface TruncateOptions {
  pad?: boolean
  more?: string
}

export const truncate =
(text: string, maxLength: number, options: TruncateOptions = {}): string => {
  let result = ''
  let length = 0
  const more = options.more || '…'
  const moreLength = stringWidth(more)
  if (moreLength > maxLength) {
    return ' '.repeat(maxLength)
  }
  for (const f of text) {
    const width = stringWidth(f)
    if (length + width + moreLength > maxLength) {
      length += moreLength
      result += more
      if (options.pad && length < maxLength) {
        result += ' '.repeat(maxLength - length)
      }
      break
    } else {
      length += width
      result += f
    }
  }
  return result
}

export default truncate
