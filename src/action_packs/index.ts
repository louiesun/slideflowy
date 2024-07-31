import * as pkgs from './__index__'

export * from './__index__'

export type ActionState = pkgs.State

export type RootActions = pkgs.Actions

export const reducer = pkgs.reducer

export const epic = pkgs.epic
