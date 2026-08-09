import type { Components } from "../checkComponents";
import { matchHexString } from "../matchers";

function hexPair(hex: string, offset: number): number {
	return Number.parseInt(hex.slice(offset, offset + 2), 16);
}

export default function hexToRgb(str: string): Components {
	const lower = str.toLowerCase();

	if (!matchHexString(lower)) {
		throw new Error("Invalid hex string");
	}

	const hex = lower.startsWith("#") ? lower.slice(1) : lower;
	const { length } = hex;

	if (length === 3) {
		return [
			Number.parseInt(hex.charAt(0), 16) * 0x11,
			Number.parseInt(hex.charAt(1), 16) * 0x11,
			Number.parseInt(hex.charAt(2), 16) * 0x11,
		];
	}

	if (length === 6) {
		return [hexPair(hex, 0), hexPair(hex, 2), hexPair(hex, 4)];
	}

	return [
		hexPair(hex, 0),
		hexPair(hex, 2),
		hexPair(hex, 4),
		hexPair(hex, 6) / 255,
	];
}
