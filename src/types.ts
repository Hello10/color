import type { Mode } from "./Mode";

export type ColorObject = Record<string, number | undefined>;

export type ColorInput = string | number[] | ColorObject;

export interface ColorData {
	mode: Mode;
	components: number[];
}
