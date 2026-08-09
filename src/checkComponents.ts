export type Components =
	| [number, number, number]
	| [number, number, number, number];

export default function checkComponents(
	components: number[],
): asserts components is Components {
	const { length } = components;
	if (length < 3 || length > 4) {
		throw new Error("Components must have 3 or 4 elements");
	}
}
