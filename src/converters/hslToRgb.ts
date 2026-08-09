import checkComponents, { type Components } from "../checkComponents";
import { componentAlpha } from "./componentAlpha";

// Based off of https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB
export default function hslToRgb(components: number[]): Components {
	checkComponents(components);

	const [, saturation, lightness] = components;
	const alpha = componentAlpha(components);

	// this is for the indexing below, without it, things get fucked up
	// on inputs like [0, 0.23, 0.45]
	let hue = components[0];
	if (hue === 0) {
		hue = 360;
	}

	const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
	const offset = lightness - chroma / 2;
	const sector = hue / 60.0;
	const x = chroma * (1 - Math.abs((sector % 2) - 1));

	const sextant = Math.ceil(sector) - 1;
	const sextants: [number, number, number][] = [
		[chroma, x, 0],
		[x, chroma, 0],
		[0, chroma, x],
		[0, x, chroma],
		[x, 0, chroma],
		[chroma, 0, x],
	];
	const base = sextants[sextant] ?? [0, 0, 0];

	const new_components: Components = [
		(base[0] + offset) * 255,
		(base[1] + offset) * 255,
		(base[2] + offset) * 255,
	];

	if (alpha !== undefined) {
		new_components.push(alpha);
	}

	return new_components;
}

// Based off https://stackoverflow.com/a/9493060/178043
export function hslToRgbAlt(components: number[]): Components {
	checkComponents(components);

	const [, saturation, lightness] = components;
	const alpha = componentAlpha(components);
	const hue = components[0] / 360;

	let rgb: [number, number, number];
	if (saturation === 0) {
		rgb = [lightness, lightness, lightness];
	} else {
		let q: number;
		if (lightness < 0.5) {
			q = lightness * (1 + saturation);
		} else {
			q = lightness + saturation - lightness * saturation;
		}
		const p = 2 * lightness - q;

		const channel = (input: number): number => {
			let h = input;
			if (h < 0) {
				h += 1;
			}
			if (h > 1) {
				h -= 1;
			}

			if (h < 1 / 6) {
				return p + (q - p) * 6 * h;
			}
			if (h < 1 / 2) {
				return q;
			}
			if (h < 2 / 3) {
				return p + (q - p) * (2 / 3 - h) * 6;
			}
			return p;
		};

		rgb = [channel(hue + 1 / 3), channel(hue), channel(hue - 1 / 3)];
	}

	const new_components: Components = [rgb[0] * 255, rgb[1] * 255, rgb[2] * 255];

	if (alpha !== undefined) {
		new_components.push(alpha);
	}

	return new_components;
}
