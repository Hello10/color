import checkComponents, { type Components } from "../checkComponents";
import { componentAlpha } from "./componentAlpha";

export default function hslToHsv(components: number[]): Components {
	checkComponents(components);

	const [hue, saturation_l, lightness] = components;
	const alpha = componentAlpha(components);

	const min_lightness = Math.min(lightness, 1 - lightness);
	const value = lightness + saturation_l * min_lightness;

	let saturation_v: number;
	if (value === 0) {
		saturation_v = 0;
	} else {
		saturation_v = 2 * (1 - lightness / value);
	}

	const new_components: Components = [hue, saturation_v, value];

	if (alpha !== undefined) {
		new_components.push(alpha);
	}

	return new_components;
}
