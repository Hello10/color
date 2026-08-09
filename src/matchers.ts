import { hasAllCharkeys } from "@hello10/etc";

export function matchCssString(str: string): RegExpMatchArray | null {
	return str.match(/^(rgb|hsl)a?\(/i);
}

export function matchHexString(str: string): RegExpMatchArray | null {
	return str.match(/^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
}

export const isRgb = hasAllCharkeys(["r", "g", "b"]);
export const isHsl = hasAllCharkeys(["h", "s", "l"]);
export const isHsv = hasAllCharkeys(["h", "s", "v"]);
