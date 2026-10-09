import { C } from "./colors";

export const DIAG = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
export const HORZ = { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } };

export type G2 = readonly [string, string];

export const G_PRIMARY: G2 = [C.tide, C.lagoon];
export const G_CORAL: G2 = [C.coral, C.coral2];