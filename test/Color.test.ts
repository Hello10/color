import { betweener, charkeys, times } from "@hello10/etc";
import { describe, expect, it } from "vitest";

import Color, { type ColorObject, type Mode } from "../src";

function assertValidRgb(color: Color) {
	expect(color.mode).toBe("rgb");
	const validComponent = betweener("[0, 255]");
	expect(color.rgb.every(validComponent)).toBe(true);
}

function percent(num: number): number {
	return Math.round(100 * num);
}

function colorsFromObjAndSingleCharVersion(obj: ColorObject) {
	return (fn: (color: Color) => void) => {
		const inputs = [obj, charkeys(obj) as ColorObject];

		inputs.map((input) => Color.create(input)).forEach(fn);
	};
}

describe("Color", () => {
	describe("constructor", () => {
		it("should require valid mode and components args", () => {
			const good_mode = "rgb";
			const good_components = [10, 1, 1];
			const bad_mode = "barf";
			const bad_components = [0];

			expect(() => {
				return new Color({
					mode: good_mode,
					components: good_components,
				});
			}).not.toThrow();

			const bad_inputs = [
				{
					mode: good_mode,
				},
				{
					components: good_components,
				},
				{
					mode: good_mode,
					components: bad_components,
				},
				{
					mode: bad_mode,
					components: good_components,
				},
				[1, 2, 3],
				130,
				"fart",
			];

			for (const bad_input of bad_inputs) {
				expect(() => {
					// biome-ignore lint/suspicious/noExplicitAny: intentionally invalid input
					return new Color(bad_input as any);
				}).toThrow();
			}
		});
	});

	describe(".create", () => {
		it("should fail on invalid input", () => {
			expect(() => {
				// biome-ignore lint/suspicious/noExplicitAny: intentionally invalid input
				Color.create(1234 as any);
			}).toThrow();
		});

		it("should create color in rgb mode when passed array", () => {
			const rgb = [213, 20, 31];
			const color = Color.create(rgb);
			expect(color.mode).toBe("rgb");
			expect(color.components).toEqual([...rgb, 1.0]);
		});

		it("should create color in rgb mode when hex string passed", () => {
			const hex = "#23f84900";
			const color = Color.create(hex);
			expect(color.mode).toBe("rgb");
			expect(color.components).toEqual([35, 248, 73, 0]);
		});

		it("should create color in rgb mode when rgba css string passed", () => {
			const rgba_css = "rgba(128, 127, 126, 0.5)";
			const color = Color.create(rgba_css);
			expect(color.mode).toBe("rgb");
			expect(color.components).toEqual([128, 127, 126, 0.5]);
		});

		it("should create color in hsl mode when hsl css string passed", () => {
			const hsl_css = "hsl(300, 100%, 50%)";
			const color = Color.create(hsl_css);
			expect(color.mode).toBe("hsl");
			expect(color.components).toEqual([300, 1.0, 0.5, 1.0]);
		});

		it("should create color in rgb mode when rgb object passed", () => {
			const obj = {
				red: 200,
				green: 200,
				blue: 150,
				alpha: 0.5,
			};
			colorsFromObjAndSingleCharVersion(obj)((color) => {
				expect(color.mode).toBe("rgb");
				const expected = [obj.red, obj.green, obj.blue, obj.alpha];
				expect(color.components).toEqual(expected);
			});
		});

		it("should create color in hsl mode when hsl object passed", () => {
			const obj = {
				hue: 340,
				saturation: 0.5,
				lightness: 0.25,
			};
			colorsFromObjAndSingleCharVersion(obj)((color) => {
				expect(color.mode).toBe("hsl");
				const expected = [obj.hue, obj.saturation, obj.lightness, 1.0];
				expect(color.components).toEqual(expected);
			});
		});

		it("should create color in hsv mode when hsv object passed", () => {
			const obj = {
				hue: 190,
				saturation: 0.2,
				value: 0.8,
			};
			colorsFromObjAndSingleCharVersion(obj)((color) => {
				expect(color.mode).toBe("hsv");
				const expected = [obj.hue, obj.saturation, obj.value, 1.0];
				expect(color.components).toEqual(expected);
			});
		});
	});

	for (const format of ["Hsl", "Hsv", "Rgb"] as const) {
		const fn = `from${format}` as "fromHsl" | "fromHsv" | "fromRgb";
		const mode = format.toLowerCase();

		describe(fn, () => {
			it("should accept arrays", () => {
				const input = [240, 1, 1];
				const color = Color[fn](input);
				expect(color.mode).toBe(mode);
				expect(color.components).toEqual([...input, 1.0]);
			});

			it("should throw on bad format", () => {
				const inputs = [[1, 2, 3, 4, 5], "farts", {}];
				for (const input of inputs) {
					expect(() => {
						// biome-ignore lint/suspicious/noExplicitAny: intentionally invalid input
						Color[fn](input as any);
					}).toThrow();
				}
			});
		});
	}

	describe(".fromString", () => {
		it("should fail on bad string format", () => {
			expect(() => {
				Color.fromString("fart");
			}).toThrow();
		});
	});

	describe(".fromName", () => {
		it("should create a color from a valid name", () => {
			const berkeley_rgb = [0, 50, 98];
			const color = Color.fromName("BerkeleyBlue");
			expect(color.mode).toBe("rgb");
			expect(color.components).toEqual([...berkeley_rgb, 1.0]);
		});

		it("should error on invalid name", () => {
			expect(() => {
				Color.fromName("BlueBarf");
			}).toThrow(/No color named/);
		});
	});

	describe(".nameExists", () => {
		it("should test whether name exists", () => {
			expect(Color.nameExists("BerkeleyBlue")).toBe(true);
			expect(Color.nameExists("BarfBlue")).toBe(false);
		});
	});

	describe(".names", () => {
		it("should return a list of color names", () => {
			const names = Color.names();
			expect(names.length).toBeGreaterThan(0);
			expect(names).toContain("BerkeleyBlue");
		});
	});

	describe(".random", () => {
		it("should return a valid rgb color", () => {
			times(50)(() => {
				const color = Color.random();
				assertValidRgb(color);
			});
		});
	});

	describe(".equals", () => {
		it("should compare colors based on name if created from name", () => {
			const one = Color.fromName("BerkeleyBlue");
			const two = Color.fromString("BerkeleyBlue");
			const three = Color.fromString("Blue");
			expect(one.equals(two)).toBe(true);
			expect(two.equals(one)).toBe(true);
			expect(one.equals(three)).toBe(false);
			expect(three.equals(two)).toBe(false);
		});

		it("should compare colors created from different sources", () => {
			const bb = Color.fromRgb([0, 50, 98]);
			expect(bb.equals("BerkeleyBlue")).toBe(true);
			const mid = Color.fromHsl([180, 0.5, 0.5]);
			expect(mid.equals(bb)).toBe(false);
			const bb2 = Color.fromHsl([
				209.3877551020408, 1.0000000000000002, 0.19215686274509805,
			]);
			expect(bb2.equals(bb)).toBe(true);
		});

		it("should handle falsey arg", () => {
			const gray = Color.fromRgb([55, 55, 55]);
			expect(gray.equals(null)).toBe(false);
			expect(gray.equals(false)).toBe(false);
			expect(gray.equals(undefined)).toBe(false);
		});
	});

	describe(".get", () => {
		it("should get color object", () => {
			const gray = Color.fromHex("#808080ff");
			expect(gray.get()).toEqual({
				red: 128,
				green: 128,
				blue: 128,
				alpha: 1,
			});
		});

		it("should throw on unsupported mode", () => {
			const gray = Color.fromHex("#808080ff");
			expect(() => {
				gray.get({ mode: "cmyk" as Mode });
			}).toThrow(/Invalid mode/);
		});
	});

	describe(".set", () => {
		const sets = [
			{
				hue: 250,
				saturation: 1 / 3,
				lightness: 0.375,
			},
			{
				hue: 250,
				saturation: 0.5,
				value: 0.5,
			},
			{
				red: 74.375,
				green: 63.75,
				blue: 127.5,
			},
		];
		for (const set of sets) {
			const obj = charkeys(set) as ColorObject;
			const mode = Object.keys(obj).join("");
			it(`should set with ${mode}`, () => {
				const color = Color.fromHex("#808080ff");
				color.set(obj);
				expect(color.hex6).toBe("#4a4080");
			});
		}

		it("should throw bad input", () => {
			expect(() => {
				const color = Color.fromHex("#fff");
				color.set({ barf: 100 });
			}).toThrow(/Invalid color format/);
		});
	});

	describe("getters", () => {
		it("should get", () => {
			const rphex = "#663399FF";
			const color = Color.create(rphex);

			expect(color.mode).toBe("rgb");
			expect(color.alpha).toBe(1.0);
			expect(color.a).toBe(1.0);
			expect(color.red).toBe(102);
			expect(color.r).toBe(102);
			expect(color.green).toBe(51);
			expect(color.g).toBe(51);
			expect(color.blue).toBe(153);
			expect(color.b).toBe(153);
			expect(color.mode).toBe("rgb");
			expect(color.rgba).toEqual([102, 51, 153, 1.0]);
			expect(color.rgb).toEqual([102, 51, 153]);

			// rgb -> hsl
			expect(color.hue).toBe(270);
			expect(color.h).toBe(270);
			expect(percent(color.saturation)).toBe(50);
			expect(percent(color.s)).toBe(50);
			expect(percent(color.lightness)).toBe(40);
			expect(percent(color.l)).toBe(40);
			expect(color.mode).toBe("hsl");
			expect(color.hsla).toEqual([270, 0.49999999999999994, 0.4, 1]);
			expect(color.hsl).toEqual([270, 0.49999999999999994, 0.4]);

			// hsl -> hsv
			expect(percent(color.value)).toBe(60);
			expect(percent(color.v)).toBe(60);
			expect(percent(color.saturation)).toBe(67);
			expect(percent(color.s)).toBe(67);
			expect(color.hue).toBe(270);
			expect(color.h).toBe(270);
			expect(color.mode).toBe("hsv");
			expect(color.hsva).toEqual([270, 0.6666666666666665, 0.6, 1]);
			expect(color.hsv).toEqual([270, 0.6666666666666665, 0.6]);

			// hsv -> hsl
			expect(percent(color.lightness)).toBe(40);
			expect(percent(color.l)).toBe(40);
			expect(color.mode).toBe("hsl");

			// hsl -> rgb
			expect(color.blue).toBe(153);
			expect(color.mode).toBe("rgb");

			// rgb -> hsv
			expect(percent(color.value)).toBe(60);
			expect(percent(color.v)).toBe(60);
			expect(color.mode).toBe("hsv");

			// hsv -> rgb
			expect(color.red).toBe(102);
			expect(color.mode).toBe("rgb");
		});
	});

	describe("setters", () => {
		it("should set", () => {
			const rphex = "#663399FF";
			const color = Color.create(rphex);

			color.alpha = 0.5;
			expect(color.a).toBe(0.5);
			color.a = 0.75;
			expect(color.alpha).toBe(0.75);

			color.red = 230;
			expect(color.r).toBe(230);
			color.r = 120;
			expect(color.red).toBe(120);

			color.blue = 285;
			expect(color.b).toBe(255);
			color.b = -120;
			expect(color.blue).toBe(0);

			color.green = 12;
			expect(color.g).toBe(12);
			color.g = 24;
			expect(color.green).toBe(24);

			color.hue = 215;
			expect(color.mode).toBe("hsl");
			expect(color.h).toBe(215);
			color.h = 200;
			expect(color.hue).toBe(200);

			color.saturation = 0.5;
			expect(color.s).toBe(0.5);
			color.s = 0.75;
			expect(color.saturation).toBe(0.75);

			color.lightness = 0.5;
			expect(color.l).toBe(0.5);
			color.l = 0.75;
			expect(color.lightness).toBe(0.75);
			color.value = 0.5;
			expect(color.mode).toBe("hsv");
			expect(color.v).toBe(0.5);
			color.v = 0.75;
			expect(color.value).toBe(0.75);
			color.hue = 215;
			expect(color.mode).toBe("hsv");
			expect(color.h).toBe(215);

			color.rgba = [102, 51, 153, 0.5];
			expect(color.alpha).toBe(0.5);
			expect(color.green).toBe(51);
			color.rgb = [102, 102, 102];
			expect(color.alpha).toBe(0.5);
			expect(color.blue).toBe(102);

			color.hsla = [250, 0.5, 0.5, 0.5];
			expect(color.alpha).toBe(0.5);
			expect(color.lightness).toBe(0.5);
			color.hsl = [250, 0.75, 0.75];
			expect(color.alpha).toBe(0.5);
			expect(color.saturation).toBe(0.75);

			color.hsva = [250, 0.25, 0.25, 0.5];
			expect(color.alpha).toBe(0.5);
			expect(color.value).toBe(0.25);
			color.hsv = [250, 0.15, 0.85];
			expect(color.alpha).toBe(0.5);
			expect(color.value).toBe(0.85);

			color.hex = "#66339980";
			expect(color.hex6).toBe("#663399");
			expect(color.hex).toBe("#66339980");
			expect(color.mode).toBe("rgb");
			expect(color.rgb).toEqual([102, 51, 153]);
		});
	});

	describe(".shade", () => {
		it("should darken the color", () => {
			const red = Color.fromHex("#ff0000");
			expect(red.lightness).toBe(0.5);
			red.shade(0.1);
			expect(red.lightness).toBe(0.4);
			expect(red.red).toBeLessThan(255);
		});
	});

	describe(".tint", () => {
		it("should lighten the color", () => {
			const black = Color.fromHex("#000000");
			expect(black.lightness).toBe(0);
			black.tint(0.5);
			expect(black.lightness).toBe(0.5);
			expect(black.hex6).toBe("#808080");
		});
	});

	describe(".complement", () => {
		it("should complement the color", () => {
			const red = Color.fromHex("#ff0000");
			const red_comp = red.clone().complement();
			const cyan = Color.fromHsv([180, 1.0, 1.0]);
			const cyan_comp = cyan.clone().complement();
			expect(red.hex).toBe(cyan_comp.hex);
			expect(cyan.hex).toBe(red_comp.hex);
		});
	});

	describe(".css", () => {
		const color = Color.fromName("BerkeleyBlue");

		it("should return css color declarations", () => {
			const expects = {
				hex: "#003262ff",
				hsl: "hsl(209.39,100,19.22)",
				hsla: "hsla(209.39,100,19.22,1)",
				rgb: "rgb(0,50,98)",
				rgba: "rgba(0,50,98,1)",
			} as const;

			for (const [format, expected] of Object.entries(expects)) {
				const actual = color.css({ format: format as keyof typeof expects });
				expect(actual, format).toBe(expected);
			}
		});

		it("should default to rgba when no args passed", () => {
			const rgba = color.css();
			expect(rgba).toBe("rgba(0,50,98,1)");
		});

		it("should allow to override alpha", () => {
			const hex = color.css({ format: "hex", alpha: 0.5 });
			expect(hex).toBe("#00326280");
			const rgba = color.css({ alpha: 0.5 });
			expect(rgba).toBe("rgba(0,50,98,0.5)");
		});

		it("should reject unsupported modes", () => {
			expect(() => {
				// biome-ignore lint/suspicious/noExplicitAny: intentionally invalid input
				color.css({ format: "cmyk" as any });
			}).toThrow(/Unsupported/);
		});
	});

	describe(".toString", () => {
		const color = Color.fromName("BerkeleyBlue");
		it("should render hex as string", () => {
			expect(`Wow! ${color}`).toBe("Wow! #003262ff");
		});
	});
});
