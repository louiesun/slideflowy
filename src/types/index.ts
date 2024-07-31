import { Action } from 'redux'
import { Epic as _Epic } from 'redux-observable'
import { Container } from 'inversify'
import { UploadedImage } from './models'

export { UploadedImage } from './models'

export type Epic<
  State = any,
  Input extends Action = any,
  Output extends Input = Input
> = _Epic<Input, Output, State, Container>

export type SFCProps<T = {}> = T & { children?: React.ReactNode }

export const StoreProjectNodeKeys = [
  'id',
  'content',
  'expanded',
  'completed',
  'childrenIds',
  'createdAt',
  'updatedAt',
  'images',
]

export interface StoreProjectNode {
  id: string
  content: string
  expanded: number
  completed: number
  childrenIds: StoreProjectNode['id'][]
  createdAt: number
  updatedAt: number
  images?: UploadedImage[]
}

export interface StoreSchema {
  version: number
  rootNodeIds: IProjectNode['id'][]
  nodes: { [id in StoreProjectNode['id']]: StoreProjectNode }
  slide: { bg?: string }
}

export interface IProjectNode {
  id: string
  content: string
  expanded: boolean
  completed: boolean
  childrenIds: IProjectNode['id'][]
  createdAt: Date
  updatedAt: Date
  images?: UploadedImage[]
  focusedImgUrl?: string
  depth: number
  imagePreviewUrls?: string[]
}

export interface SimpleObj<T = any> {
  [key: string]: T
}

// prettier-ignore
export type AnyFunction<AS extends any[] = any[]> = (...args: AS) => any

// prettier-ignore
export type ArgsType<T extends AnyFunction> = T extends AnyFunction<infer R> ? R : never

// prettier-ignore
export type FstArgType<F extends (arg1: any, ...args: any[]) => any> = F extends (arg1: infer R, ...args: any[]) => any ? R : never

// prettier-ignore
export type SndArgType<F extends (arg1: any, arg2: any, ...args: any[]) => any> = F extends (arg1: any, arg2: infer R, ...args: any[]) => any ? R : never

// prettier-ignore
export type ThdArgType<F extends (arg1: any, arg2: any, arg3: any, ...args: any[]) => any> = F extends (arg1: any, arg2: any, arg3: infer R, ...args: any[]) => any ? R : never

// prettier-ignore
export type OptionalPropNames<T> = { [P in keyof T]: undefined extends T[P] ? P : never }[keyof T]

// prettier-ignore
export type RequiredPropNames<T> = { [P in keyof T]: undefined extends T[P] ? never : P }[keyof T]

// prettier-ignore
export type ExcludeKey<T extends object, EK extends keyof T> =
  { [K in Exclude<OptionalPropNames<T>, EK>]?: T[K] } &
  { [K in Exclude<keyof T, EK | OptionalPropNames<T>>]: T[K] }

// prettier-ignore
export type RequiredKey<T, Key extends keyof T> =
  { [K in keyof T]: T[K] } &
  { [K in Key]-?: NonNullable<T[K]> }
