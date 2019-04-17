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
import { ChildElement, ParentElement } from './shared'
import once from 'lodash-es/once'
import clamp from 'lodash-es/clamp'
import castArray from 'lodash-es/castArray'

/* code */
// █████▒░░░░░░░░░
// ██████▓░░░░░░░░
// █████████████▓░
// █▓▒░▒▓█

export abstract class BaseElement<T extends object = {}> {
  protected proxy: Partial<T>
  protected data: Partial<T> = {}
  private pUpdate: Partial<T> = {}
  private pUpdateTimer?: ReturnType<typeof setImmediate>

  public constructor () {
    this.proxy = new Proxy(this.data, {
      get: ($, prop: keyof T): unknown => {
        const { pUpdate } = this
        if (pUpdate[prop] !== undefined) {
          return pUpdate[prop]
        } else {
          return $[prop]
        }
      },
      set: ($, prop: keyof T, value: unknown): boolean => {
        if ($[prop] === value ||
          ($[prop] === this.pUpdate[prop] && $[prop] != null)) {
          return true
        }
        this.pUpdate[prop] = value as T[keyof T]
        this.pSchedule()
        return true
      }
    })
  }

  private pSchedule = once((): void => {
    this.pUpdateTimer = setImmediate(this.flush)
  })

  protected flush = (): void => {
    let pUpdateTimer
    ;[ pUpdateTimer, this.pUpdateTimer ] = [ this.pUpdateTimer, undefined ]
    if (pUpdateTimer) {
      clearImmediate(pUpdateTimer)
    }
    let data: Partial<T>
    ;[ data, this.pUpdate ] = [ this.pUpdate, {} ]
    this.handleFlush(data)
    Object.assign(this.data, data)
    this.pSchedule = once((): void => {
      this.pUpdateTimer = setImmediate(this.flush)
    })
  }

  protected abstract handleFlush (data: Partial<T>): void
}

export type PostProcessFn = (...values: string[]) => string | string[]

export interface BaseData {
  minWidth: number
  maxWidth: number
  flexGrow: number
  flexShrink: number
  enabled: boolean
  postProcess?: PostProcessFn
}

export interface BaseOptions {
  /** Fixed width element */
  width?: number
  /** Mimimum width */
  minWidth?: number
  /** Maximum width */
  maxWidth?: number
  /** Flexing factor, set both grow and shrink */
  flex?: {
    /** Grow factor */
    grow?: number
    /** Shrink factor */
    shrink?: number
  } | number
  /** Post process values */
  postProcess?: PostProcessFn
}

export abstract class Base<T extends BaseData = BaseData>
  extends BaseElement<T>
  implements ChildElement {
  private pParent?: ParentElement
  protected outdated = false

  public constructor (options?: BaseOptions) {
    super()
    if (!options) {
      return
    }
    if (options.width != null) {
      this.width = options.width
    }
    if (options.minWidth != null) {
      this.minWidth = options.minWidth
    }
    if (options.maxWidth != null) {
      this.maxWidth = options.maxWidth
    }
    if (options.flex != null) {
      const { flex } = options
      if (typeof flex === 'number') {
        this.flex = flex
      } else {
        if (flex.grow != null) {
          this.flexGrow = flex.grow
        }
        if (flex.shrink != null) {
          this.flexShrink = flex.shrink
        }
      }
    }
    if (options.postProcess) {
      this.postProcess = options.postProcess
    }
  }

  public get postProcess (): PostProcessFn | undefined { return this.proxy.postProcess }
  public set postProcess (fn: PostProcessFn | undefined) {
    this.proxy.postProcess = fn
  }

  public get parent (): ParentElement | undefined { return this.pParent }
  public set parent (parent: ParentElement | undefined) {
    if (this.pParent != null) {
      this.beforeUnmount()
    }
    if (parent != null) {
      this.beforeMount(parent)
      this.pParent = parent
      this.mounted()
    }
  }

  protected beforeMount (_parent: ParentElement): void {
    void (_parent)
    this.flush()
  }

  protected mounted (): void {
  }

  protected beforeUnmount (): void {
  }

  protected handleFlush (data: Partial<BaseData>): void {
    const { parent } = this
    if (parent) {
      parent.notify(this, this.data, data)
    }
    this.outdated = true
  }

  public get width (): number { throw new Error('width has no fixed value') }
  public set width (value: number) {
    this.minWidth = value
    this.maxWidth = value
  }

  public get minWidth (): number { return this.proxy.minWidth || 0 }
  public set minWidth (value: number) {
    this.proxy.minWidth = value >= 0 ? value : 0
  }

  public get maxWidth (): number {
    return this.proxy.maxWidth || Number.MAX_SAFE_INTEGER
  }
  public set maxWidth (value: number) {
    this.proxy.maxWidth = Math.min(value >= 0 ? value : Number.MAX_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER)
  }

  public set flex (value: number) {
    this.flexGrow = value
    this.flexShrink = value
  }

  /** Check if item is flexible */
  public get isFlexible (): boolean {
    return this.minWidth < this.maxWidth
  }

  public get flexGrow (): number {
    return (this.enabled && this.proxy.flexGrow) || 0
  }
  public set flexGrow (value: number) {
    this.proxy.flexGrow = value >= 0 ? value : 0
  }
  public get flexShrink (): number {
    return (this.enabled && this.proxy.flexShrink) || 0
  }
  public set flexShrink (value: number) {
    this.proxy.flexShrink = value >= 0 ? value : 0
  }

  public get enabled (): boolean {
    return this.proxy.enabled != null ? this.proxy.enabled : true
  }
  public set enabled (value: boolean) {
    this.proxy.enabled = value
  }

  protected abstract handleCalculateWidth (): number
  protected abstract handleRender (maxWidth?: number): string | string[]

  protected beforeRender (_maxWidth?: number): boolean {
    void (_maxWidth)
    return this.enabled
  }

  protected rendered (texts: string[]): string {
    const { postProcess } = this
    if (postProcess) {
      texts = castArray(postProcess(...texts))
    }
    return texts.join('')
  }

  public calculateWidth (): number {
    if (!this.enabled) {
      return 0
    }
    return clamp(this.handleCalculateWidth(),
      Math.min(this.minWidth, this.maxWidth),
      this.maxWidth)
  }

  public render (maxWidth?: number): string {
    if (!this.beforeRender(maxWidth) || maxWidth === 0) {
      return ''
    }
    return this.rendered(castArray(this.handleRender(maxWidth)))
  }
}
