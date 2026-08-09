import { charkeys, defined, rounder } from "@hello10/etc";

import { componentNames, Mode } from "../Mode";
import { isHsl, isRgb } from "../matchers";
import type { ColorObject } from "../types";

const round2 = rounder({ decimals: 2 });

export default function colorToCss(input: ColorObject): string {
	const obj = charkeys(input);

	let mode: Mode;
	if (isRgb(obj)) {
		mode = Mode.rgb;
	} else if (isHsl(obj)) {
		mode = Mode.hsl;
	} else {
		throw new Error("Unsupported format");
	}

	const names = componentNames({ mode, abbreviated: true });
	let components = names.map((name) => obj[name] as number);

	if (mode === Mode.hsl) {
		components[1] = (components[1] as number) * 100;
		components[2] = (components[2] as number) * 100;
	}

	let fn: string = mode;
	if (defined(obj.a)) {
		fn += "a";
	} else {
		components = components.slice(0, 3);
	}

	components = components.map(round2);
	return `${fn}(${components.join(",")})`;
}
