import { stripComments } from '@navirox/source'

/**
 * What a file declares.
 *
 * Angular's own compiler decides what a file is from its decorators, and a reading
 * that decided from the file name would disagree with the compiler in the way that
 * is hardest to notice: a file named like a component that is not one would appear
 * in the report, and a component that lives somewhere unexpected would not.
 *
 * The reading is textual rather than compiled. A decorator inside a comment is not
 * a decorator, so comments are stripped first, and a decorator this scan misses
 * costs a missing unit rather than a wrong one.
 */

export interface AngularDeclaration {
  readonly component: boolean
  readonly injectable: boolean
  readonly pipe: boolean
  readonly module: boolean
  readonly inlineTemplate: boolean
  readonly externalTemplate: boolean
  /** True when the class holds reactive state, which is what makes a service a state module. */
  readonly holdsState: boolean
}

const COMPONENT = /@Component\s*\(/
const INJECTABLE = /@Injectable\s*\(/
const PIPE = /@Pipe\s*\(/
const MODULE = /@NgModule\s*\(/
const INLINE_TEMPLATE = /\btemplate\s*:/
const EXTERNAL_TEMPLATE = /\btemplateUrl\s*:/
const REACTIVE_STATE = /\b(signal|WritableSignal|BehaviorSubject|ReplaySubject|Signal)\s*[(<]/

export function readDeclaration(text: string): AngularDeclaration {
  const code = stripComments(text)

  return {
    component: COMPONENT.test(code),
    injectable: INJECTABLE.test(code),
    pipe: PIPE.test(code),
    module: MODULE.test(code),
    inlineTemplate: INLINE_TEMPLATE.test(code),
    externalTemplate: EXTERNAL_TEMPLATE.test(code),
    holdsState: REACTIVE_STATE.test(code),
  }
}
