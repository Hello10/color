import checkComponents, { type Components } from "../checkComponents";
import { Mode } from "../Mode";
import { componentAlpha } from "./componentAlpha";

// https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB
export default function rgbToHslOrHsv({
	components,
	mode,
}: {
	components: number[];
	mode: typeof Mode.hsl | typeof Mode.hsv;
}): Components {
	checkComponents(components);

	const [red255, green255, blue255] = components;
	const red = red255 / 255.0;
	const green = green255 / 255.0;
	const blue = blue255 / 255.0;
	const alpha = componentAlpha(components);

	const max = Math.max(red, green, blue);
	const min = Math.min(red, green, blue);

	const value = max;
	const chroma = max - min;
	const lightness = (max + min) / 2.0;

	let hue: number;
	if (chroma === 0) {
		hue = 0;
	} else if (max === red) {
		hue = (green - blue) / chroma;
	} else if (max === green) {
		hue = (blue - red) / chroma + 2;
	} else {
		hue = (red - green) / chroma + 4;
	}
	if (hue < 0) {
		hue += 6.0;
	}
	hue *= 60.0;

	let new_components: Components;
	if (mode === Mode.hsl) {
		let saturation: number;
		if (lightness === 0 || lightness === 1) {
			saturation = 0;
		} else {
			saturation = chroma / (1 - Math.abs(2 * lightness - 1));
		}
		new_components = [hue, saturation, lightness];
	} else {
		const saturation = value === 0 ? 0 : chroma / value;
		new_components = [hue, saturation, value];
	}

	if (alpha !== undefined) {
		new_components.push(alpha);
	}

	return new_components;
}
