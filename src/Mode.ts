export const Mode = {
	rgb: "rgb",
	hsv: "hsv",
	hsl: "hsl",
} as const;

export type Mode = (typeof Mode)[keyof typeof Mode];

export type ComponentName =
	| "red"
	| "green"
	| "blue"
	| "hue"
	| "saturation"
	| "lightness"
	| "value"
	| "alpha";

export function componentNames({
	mode,
	abbreviated = false,
}: {
	mode: Mode;
	abbreviated?: boolean;
}): string[] {
	const names: Record<Mode, string[]> = {
		[Mode.rgb]: ["red", "green", "blue", "alpha"],
		[Mode.hsl]: ["hue", "saturation", "lightness", "alpha"],
		[Mode.hsv]: ["hue", "saturation", "value", "alpha"],
	};
	let result = names[mode];
	if (abbreviated) {
		result = result.map((name) => name.charAt(0));
	}
	return result;
}
