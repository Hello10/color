import { rounder } from "@hello10/etc";
import { describe, expect, it } from "vitest";

import { converters } from "../src";

const {
	colorToCss,
	cssToColor,
	hexToRgb,
	hslToHsv,
	hslToRgb,
	hslToRgbAlt,
	hsvToHsl,
	hsvToRgb,
	rgbToHex,
	rgbToHsl,
	rgbToHsv,
} = converters;

const round5 = rounder({ decimals: 5 });

function roundDeepEqual(arr1: number[], arr2: number[]) {
	function round5All(arr: number[]): number[] {
		return arr.map(round5);
	}
	expect(round5All(arr1)).toEqual(round5All(arr2));
}

function assertInterconvert({
	to,
	from,
	input,
}: {
	to: (components: number[]) => number[];
	from: (components: number[]) => number[];
	input: number[];
}) {
	const output = from(to(input));
	roundDeepEqual(output, input);
}

describe("converters", () => {
	describe("that accept components", () => {
		it("should fail on invalid components format", () => {
			const converts = [
				hslToHsv,
				hslToRgb,
				hsvToHsl,
				hsvToRgb,
				rgbToHex,
				rgbToHsl,
				rgbToHsv,
			];
			for (const convert of converts) {
				expect(() => {
					convert([1, 2]);
				}).toThrow();
				expect(() => {
					convert([1, 2, 3, 4, 5]);
				}).toThrow();
			}
		});
	});

	describe("colorToCss", () => {
		it("should convert a color object to css", () => {
			const css = colorToCss({
				red: 255,
				green: 255,
				blue: 255,
				alpha: 1.0,
			});
			expect(css).toBe("rgba(255,255,255,1)");
		});

		it("should throw for unsupported format", () => {
			expect(() => {
				colorToCss({
					h: 140,
					s: 0.5,
					v: 0.5,
					a: 1.0,
				});
			}).toThrow();
		});
	});

	describe("cssToColor", () => {
		it("should convert css to color object", () => {
			const obj = cssToColor("rgba(255,255,255,1)");
			expect(obj).toEqual({
				red: 255,
				green: 255,
				blue: 255,
				alpha: 1.0,
			});
		});

		it("should throw for unsupported format", () => {
			expect(() => {
				cssToColor("cmyk(100%, 0%, 0%, 0%)");
			}).toThrow();
		});
	});

	describe("hexToRgb", () => {
		it("should handle 3 value hex", () => {
			const rgb = hexToRgb("#fff");
			expect(rgb).toEqual([255, 255, 255]);
		});

		it("should handle 6 value hex", () => {
			const rgb = hexToRgb("#f0f1f2");
			expect(rgb).toEqual([240, 241, 242]);
		});

		it("should handle 8 value hex", () => {
			const rgb = hexToRgb("#000000ff");
			expect(rgb).toEqual([0, 0, 0, 1.0]);
		});

		it("should fail on bad format", () => {
			expect(() => {
				hexToRgb("#f");
			}).toThrow();
		});
	});

	describe("hexToRgb <=> rgbToHex", () => {
		it("should interconvert", () => {
			const inputs = ["#a4c639f0", "#030122", "#ffffffff", "#00000000"];
			for (const input of inputs) {
				const rgb = hexToRgb(input);
				const hex = rgbToHex(rgb);
				expect(hex).toBe(input);
			}
		});
	});

	describe("hslToHsv <=> hsvToHsl", () => {
		it("should interconvert", () => {
			const inputs = [
				[205, 0.39, 0.6],
				[301, 1.0, 0.4, 1.0],
			];
			for (const input of inputs) {
				assertInterconvert({
					to: hslToHsv,
					from: hsvToHsl,
					input,
				});
				assertInterconvert({
					to: hsvToHsl,
					from: hslToHsv,
					input,
				});
			}
		});

		it("has some information losing edge cases", () => {
			// when lightness / value are 0, interconversion loses information
			// TODO: is this avoidable without adding auxiliary data purely for the
			//       purposes of invertibility?
			const hsl_lightness0 = [280, 0.39, 0];
			expect(hsvToHsl(hslToHsv(hsl_lightness0))).toEqual([280, 0, 0]);
			const hsv_value0 = [83, 0.56, 0];
			expect(hslToHsv(hsvToHsl(hsv_value0))).toEqual([83, 0, 0]);
		});
	});

	describe("hslToRgb <=> rgbToHsl", () => {
		it("should interconvert from hsl to rgb and back", () => {
			const hsls = [
				[348, 0.78, 0.53],
				[127, 0.44, 0.88, 1.0],
				[0, 0.23, 0.45],
			];
			for (const hsl of hsls) {
				assertInterconvert({
					to: hslToRgb,
					from: rgbToHsl,
					input: hsl,
				});
			}
		});

		it("should interconvert from rgb to hsl and back", () => {
			const rgbs = [
				[243, 122, 84],
				[128, 128, 128, 0.5],
				[0, 0, 0],
				[255, 128, 0, 0.75],
			];
			for (const rgb of rgbs) {
				assertInterconvert({
					to: rgbToHsl,
					from: hslToRgb,
					input: rgb,
				});
			}
		});

		it("has some information losing edge cases", () => {
			// When lightness is 1 or 0, hue and saturation are set to 0
			// TODO: is this avoidable without adding auxiliary data purely for the
			//       purposes of invertibility?
			const hsl_lightness0 = [10, 0.5, 0];
			let hsl_output = rgbToHsl(hslToRgb(hsl_lightness0));
			expect(hsl_output).toEqual([0, 0, 0]);

			const hsl_lightness1 = [250, 0.3, 1];
			hsl_output = rgbToHsl(hslToRgb(hsl_lightness1));
			expect(hsl_output).toEqual([0, 0, 1]);
		});
	});

	describe("hslToRgbAlt", () => {
		it("should agree with hslToRgb", () => {
			const inputs = [
				[348, 0.78, 0.53],
				[127, 0.44, 0.88, 1.0],
				[0, 0.23, 0.45],
				[280, 0, 0.5],
				[0, 0, 0],
			];
			for (const input of inputs) {
				roundDeepEqual(hslToRgbAlt(input), hslToRgb(input));
			}
		});
	});

	describe("rgbToHsv <=> hsvToRgb", () => {
		it("should interconvert", () => {
			assertInterconvert({
				to: rgbToHsv,
				from: hsvToRgb,
				input: [114, 160, 194, 1.0],
			});
		});
	});

	describe("hex -> rgb -> hsv -> hsl -> rgb -> hex", () => {
		it("should end with same hex code we started with", () => {
			const input = "#a4c639f0";
			const output = rgbToHex(hslToRgb(hsvToHsl(rgbToHsv(hexToRgb(input)))));
			expect(input).toBe(output);
		});
	});
});
