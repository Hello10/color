import checkComponents, { type Components } from "../checkComponents";
import { componentAlpha } from "./componentAlpha";

export default function hsvToHsl(components: number[]): Components {
	checkComponents(components);

	const [hue, saturation_v, value] = components;
	const alpha = componentAlpha(components);

	const lightness = value * (1 - saturation_v / 2);

	let saturation_l: number;
	if (lightness === 0 || lightness === 1) {
		saturation_l = 0;
	} else {
		const min_lightness = Math.min(lightness, 1 - lightness);
		saturation_l = (value - lightness) / min_lightness;
	}

	const new_components: Components = [hue, saturation_l, lightness];

	if (alpha !== undefined) {
		new_components.push(alpha);
	}

	return new_components;
}
