import checkComponents from "../checkComponents";
import { componentAlpha } from "./componentAlpha";

export default function rgbToHex(components: number[]): string {
	checkComponents(components);

	const values = components.slice(0, 3);
	const alpha = componentAlpha(components);
	if (alpha !== undefined) {
		values.push(alpha * 255);
	}

	const hex_values = values.map((value) => {
		let hex = Math.round(value).toString(16).toLowerCase();
		if (hex.length === 1) {
			hex = `0${hex}`;
		}
		return hex;
	});

	return `#${hex_values.join("")}`;
}
