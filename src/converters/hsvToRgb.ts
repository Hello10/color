import checkComponents, { type Components } from "../checkComponents";
import { componentAlpha } from "./componentAlpha";

export default function hsvToRgb(components: number[]): Components {
	checkComponents(components);

	const [hue, saturation, value] = components;
	const alpha = componentAlpha(components);

	const hue_sector = hue / 60.0;
	const sextant = Math.floor(hue_sector);
	const offset = hue_sector - sextant;

	const p = value * (1 - saturation) * 255;
	const q = value * (1 - saturation * offset) * 255;
	const t = value * (1 - saturation * (1 - offset)) * 255;
	const v = value * 255;

	const sextants: [number, number, number][] = [
		[v, t, p],
		[q, v, p],
		[p, v, t],
		[p, q, v],
		[t, p, v],
		[v, p, q],
	];
	const base = sextants[sextant % 6] ?? [0, 0, 0];

	const new_components: Components = [base[0], base[1], base[2]];

	if (alpha !== undefined) {
		new_components.push(alpha);
	}

	return new_components;
}
