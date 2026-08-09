import { matchCssString } from "../matchers";
import type { ColorObject } from "../types";

export default function cssToColor(str: string): ColorObject {
	if (!matchCssString(str)) {
		throw new Error("Invalid css string");
	}

	const components = str.replace(/[^\d,.]/g, "").split(",");

	const is_hsl = str.includes("hsl");
	const names = is_hsl
		? ["hue", "saturation", "lightness"]
		: ["red", "green", "blue"];

	const color: ColorObject = {};
	names.forEach((name, index) => {
		let value = Number.parseFloat(components[index] ?? "");
		if (["saturation", "lightness"].includes(name)) {
			value /= 100;
		}
		color[name] = value;
	});

	const has_alpha = str.includes("a");
	if (has_alpha) {
		color.alpha = Number.parseFloat(components[3] ?? "");
	}

	return color;
}
