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
import { Group, GroupOptions } from '../components/group'
import {
  clearLine
  , clearScreenDown
  , cursorTo } from 'readline'
import stringWidth from '../optional/string-width'
import { StringLike } from '../utils/data-string'
import { Console } from 'console'
import { SYNCING_INTERVAL } from '../common'
import once = require('lodash/once')

/* code */
// █████▒░░░░░░░░░
// ██████▓░░░░░░░░
// █████████████▓░
// █▓▒░▒▓█
/** @public
 * The stream to write output to.
 * The condition is not as strict as WriteStream.
 */
export interface OutputStream extends NodeJS.WritableStream {
  isTTY?: boolean
  columns?: number
  rows?: number
}

/** @public
 * Describe options to Output constructor().
 */
export interface OutputOptions extends GroupOptions {
  /** Stream to write its output to */
  stream?: OutputStream
}

/** @public
 * Frame callback function.
 */
type FrameCB = (frame: number) => void

/** @internal */
interface Target {
  columns: number
  clearLine (): void
  update (text: StringLike): void
}

/** @internal */
export class TargetWriteOnly implements Target {
  public readonly stream: OutputStream
  public constructor (stream: OutputStream) {
    this.stream = stream
  }

  public get columns (): number {
    return 72
  }

  public clearLine (): void {
    const { stream } = this
    stream.write('\n')
  }

  public update (text: string): void {
    const { stream } = this
    stream.write(text + '\n')
  }
}

/** @internal */
export class TargetTTY implements Target {
  public readonly stream: OutputStream
  private pLastColumns = 0
  private pLastWidth = 0
  public constructor (stream: OutputStream) {
    this.stream = stream
    if (!stream.isTTY) {
      throw new Error('stream is not TTY')
    }
  }

  /** Clear display line */
  public clearLine (): void {
    const { stream } = this
    clearLine(stream, 0)
    cursorTo(stream, 0)
  }

  public get columns (): number {
    return this.stream.columns || 40
  }

  public update (text: StringLike): void {
    const { stream, columns, pLastColumns } = this
    {
      const width = stringWidth(text.toString())
      if (width !== this.pLastWidth) {
        this.clearLine()
      }
      this.pLastWidth = width
    }
    if (pLastColumns !== columns) {
      this.pLastColumns = columns
      this.clearLine()
      clearScreenDown(stream)
    }
    stream.write(text.toString())
    if (text.length < columns) {
      clearLine(stream, 1)
    }
    cursorTo(stream, 0)
  }
}

/** @public
 * Output to stderr.
 * Unlike other elements that don't do anything on their own.
 * This element will write its output to a stream (default to stderr).
 */
export class Output extends Group {
  public readonly stream: OutputStream
  public readonly isTTY: boolean = true
  protected readonly console: Console
  /** @internal */
  private pCreatedTime = Date.now()
  /** @internal */
  private pNextFrameCBs = new Set<FrameCB>()
  /** @internal */
  private pTarget: Target
  /** @internal */
  private pLastText: string = ''
  /** @internal */
  private pIsOutdated = false
  /** @internal */
  private pFrame = 0
  /** @internal */
  public renderedCount = 0

  public constructor (options?: OutputOptions) {
    super(options)
    if (options && options.stream) {
      const { stream } = options
      this.stream = stream
      this.isTTY = !!stream.isTTY
    } else {
      this.stream = process.stderr
      this.isTTY = !!this.stream.isTTY
    }
    if (this.isTTY) {
      this.pTarget = new TargetTTY(this.stream)
    } else {
      this.pTarget = new TargetWriteOnly(this.stream)
    }
    this.console = new Console(this.stream)
  }

  /**
   * This element cannot be added to other element.
   * Parent is always undefined, and will throw an error if you try
   * to change its value.
   */
  public get parent (): undefined { return undefined }
  public set parent (_value: undefined) {
    throw new Error('class Output cannot have parent')
  }

  public get enabled (): boolean { return super.enabled }
  public set enabled (value: boolean) {
    if (!value) {
      this.pTarget.clearLine()
    } else {
      this.pScheduleFrame()
    }
    super.enabled = value
  }

  public markDirty (): void {
    this.pIsOutdated = true
    if (this.pScheduleFrame) {
      this.pScheduleFrame()
    }
    super.markDirty()
  }

  /**
   * Elapsed time since creation
   */
  public get elapsed (): number {
    return Date.now() - this.pCreatedTime
  }

  /**
   * Remove all sub-elements as well as clear the display.
   * @param clearLine - whether or not to clear the display, default to `true`
   */
  public clear (clearLine = true): void {
    super.clear()
    if (clearLine) {
      this.pTarget.clearLine()
    }
  }

  /**
   * Clear the displayed line.
   */
  public clearLine (): void {
    this.pTarget.clearLine()
  }

  public nextFrame (cb: (frame: number) => void): boolean {
    const { pNextFrameCBs } = this
    pNextFrameCBs.add(cb)
    this.pScheduleFrame()
    return true
  }

  /** @internal */
  private pProcessFrame = (): void => {
    setTimeout((): void => {
      const { pNextFrameCBs } = this
      // const frame = Math.round(this.elapsed / SYNCING_INTERVAL)
      const frame = this.pFrame++
      this.pNextFrameCBs = new Set()
      this.pScheduleFrame = once(this.pProcessFrame)
      for (const cb of pNextFrameCBs) {
        cb(frame)
      }
      /* Frame has to be updated after callbacks */
      if (this.pIsOutdated) {
        this.update()
        this.pIsOutdated = false
      }
    }, SYNCING_INTERVAL).unref()
  }

  /** @internal */
  private pScheduleFrame = once(this.pProcessFrame)

  /** @internal */
  protected update (): void {
    this.renderedCount++
    const { pTarget, pLastText } = this
    const text = this.render(pTarget.columns)
    const cache = text.toString()
    if (pLastText === cache) {
      return
    }
    this.pLastText = cache
    pTarget.update(text)
  }

  /** @internal */
  protected redraw (): void {
    const { pTarget, pLastText } = this
    pTarget.update(pLastText)
  }

  public group (...args: unknown[]): void {
    this.clearLine()
    this.console.group(...args)
    this.redraw()
  }

  public groupEnd (): void {
    this.console.groupEnd()
  }

  public log (...args: unknown[]): void {
    this.clearLine()
    this.console.log(...args)
    this.redraw()
  }

  public error (...args: unknown[]): void {
    this.clearLine()
    this.console.error(...args)
    this.redraw()
  }

  public warn (...args: unknown[]): void {
    this.clearLine()
    this.console.warn(...args)
    this.redraw()
  }
}
