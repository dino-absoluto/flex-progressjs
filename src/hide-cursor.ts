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
import { Base, BaseData } from './base'
import { Output, OutputStream } from './output'

/* code */
// █████▒░░░░░░░░░
// ██████▓░░░░░░░░
// █████████████▓░
// █▓▒░▒▓█

/** Hide console cursor, this can only work when added to an Output stream. */
export class HideCursor extends Base<BaseData> {
  /** HideCursor doesn't accept any options */
  public constructor () {
    super(undefined)
  }

  /** Set cursor visible state */
  public static setCursor (stream: OutputStream, visible: boolean): void {
    if (!stream.isTTY) {
      return
    }
    if (!visible) {
      stream.write('\x1B[?25l')
    } else {
      stream.write('\x1B[?25h')
    }
  }

  protected mounted (): void {
    const { parent } = this
    if (parent instanceof Output) {
      HideCursor.setCursor(parent.stream, false)
    }
  }

  protected beforeUnmount (): void {
    const { parent } = this
    if (parent instanceof Output) {
      HideCursor.setCursor(parent.stream, true)
    }
  }

  protected handleCalculateWidth (): 0 {
    return 0
  }

  protected handleRender (): '' {
    return ''
  }
}
