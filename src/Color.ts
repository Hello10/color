import { charkeys, clipper, randomInt, times } from "@hello10/etc";

import type { Components } from "./checkComponents";
import checkComponents from "./checkComponents";
import * as converters from "./converters";
import { componentAlpha } from "./converters/componentAlpha";
import { type ComponentName, componentNames, Mode } from "./Mode";
import {
	isHsl,
	isHsv,
	isRgb,
	matchCssString,
	matchHexString,
} from "./matchers";
import NamedColors from "./NamedColors";
import type { ColorData, ColorInput, ColorObject } from "./types";

const {
	colorToCss,
	cssToColor,
	hexToRgb,
	hslToHsv,
	hslToRgb,
	hsvToHsl,
	hsvToRgb,
	rgbToHex,
	rgbToHsl,
	rgbToHsv,
} = converters;

const clip1 = clipper("[0, 1]");
const clip255 = clipper("[0, 255]");
const clip360 = clipper("[0, 360]");

type Rgba = [number, number, number, number];

export type CssFormat = "hex" | "hsl" | "hsla" | "rgb" | "rgba";

const conversions: Record<string, (components: number[]) => Components> = {
	"rgb:hsl": rgbToHsl,
	"rgb:hsv": rgbToHsv,
	"hsl:rgb": hslToRgb,
	"hsl:hsv": hslToHsv,
	"hsv:rgb": hsvToRgb,
	"hsv:hsl": hsvToHsl,
};

export default class Color {
	static converters = converters;

	mode!: Mode;
	components!: Rgba;
	name: string | null = null;

	constructor(data: ColorData) {
		this._setData(data);
	}

	_setData({ mode, components }: ColorData) {
		if (!(mode && components)) {
			throw new Error("Must pass mode and components array");
		}

		if (!(mode in Mode)) {
			throw new Error(`Invalid mode ${mode}`);
		}

		checkComponents(components);

		let alpha = componentAlpha(components);
		if (alpha == null || Number.isNaN(alpha)) {
			alpha = 1.0;
		}

		const [c0, c1, c2] = components;
		const [clipA, clipB, clipC] =
			mode === Mode.rgb
				? ([clip255, clip255, clip255] as const)
				: ([clip360, clip1, clip1] as const);

		this.components = [clipA(c0), clipB(c1), clipC(c2), clip1(alpha)];
		this.mode = mode;
		this.name = null;
	}

	static create(arg: ColorInput = {}): Color {
		if (Array.isArray(arg)) {
			return Color.fromRgb(arg);
		}
		if (typeof arg === "string") {
			return Color.fromString(arg);
		}
		if (Object.keys(arg).length) {
			if (isRgb(arg)) {
				return Color.fromRgb(arg);
			}
			if (isHsl(arg)) {
				return Color.fromHsl(arg);
			}
			if (isHsv(arg)) {
				return Color.fromHsv(arg);
			}
		}
		throw new Error(
			"Invalid color format. Must be RGB array, CSS string, or RGB/HSV/HSL object",
		);
	}

	static fromString(str: string): Color {
		if (matchHexString(str)) {
			return Color.fromHex(str);
		}

		if (matchCssString(str)) {
			return Color.fromCss(str);
		}

		if (Color.nameExists(str)) {
			return Color.fromName(str);
		}

		throw new Error(`Invalid string format: ${str}`);
	}

	static fromHex(str: string): Color {
		const components = hexToRgb(str);
		return Color.fromRgb(components);
	}

	static fromCss(str: string): Color {
		const obj = cssToColor(str);
		return Color.create(obj);
	}

	static fromRgb(arg: number[] | ColorObject): Color {
		let components: number[];

		if (Array.isArray(arg)) {
			checkComponents(arg);
			components = arg;
		} else if (isRgb(arg)) {
			const { r, g, b, a } = charkeys(arg);
			components = [r, g, b, a] as number[];
		} else {
			throw new Error(`Invalid RGB format: ${arg}`);
		}

		return new this({
			mode: Mode.rgb,
			components,
		});
	}

	static fromHsl(arg: number[] | ColorObject): Color {
		let components: number[];

		if (Array.isArray(arg)) {
			checkComponents(arg);
			components = arg;
		} else if (isHsl(arg)) {
			const { h, s, l, a } = charkeys(arg);
			components = [h, s, l, a] as number[];
		} else {
			throw new Error(`Invalid HSL format: ${arg}`);
		}

		return new this({
			mode: Mode.hsl,
			components,
		});
	}

	static fromHsv(arg: number[] | ColorObject): Color {
		let components: number[];

		if (Array.isArray(arg)) {
			checkComponents(arg);
			components = arg;
		} else if (isHsv(arg)) {
			const { h, s, v, a } = charkeys(arg);
			components = [h, s, v, a] as number[];
		} else {
			throw new Error(`Invalid HSV format: ${arg}`);
		}

		return new this({
			mode: Mode.hsv,
			components,
		});
	}

	static fromName(name: string): Color {
		const rgb = NamedColors[name];
		if (!rgb) {
			throw new Error(`No color named ${name}`);
		}
		const color = Color.fromRgb(rgb);
		color.name = name;
		return color;
	}

	static names(): string[] {
		return Object.keys(NamedColors);
	}

	static nameExists(name: string): boolean {
		return name in NamedColors;
	}

	static random(): Color {
		const components = times<number>(3)(() => randomInt({ max: 255 }));
		return new this({
			mode: Mode.rgb,
			components,
		});
	}

	equals(other: Color | ColorInput | null | undefined | false): boolean {
		if (!other) {
			return false;
		}

		let color: Color;
		if (other instanceof Color && other.constructor === this.constructor) {
			color = other;
		} else {
			color = (this.constructor as typeof Color).create(other as ColorInput);
		}

		if (color.name && this.name && color.name === this.name) {
			return true;
		}

		if (color.mode === this.mode) {
			const components = color.components.slice(0, 3);
			return components.every((component, i) => {
				return component === this.components[i];
			});
		}

		return color.hex6 === this.hex6;
	}

	shade(factor: number): this {
		this.lightness -= factor;
		return this;
	}

	tint(factor: number): this {
		this.lightness += factor;
		return this;
	}

	complement(): this {
		const { mode } = this;
		if (mode === Mode.rgb) {
			this.rgb = this.rgb.map((c) => 255 - c);
		} else {
			this.hue = (this.hue + 180) % 360;
		}
		return this;
	}

	clone(): Color {
		return new (this.constructor as typeof Color)({
			mode: this.mode,
			components: [...this.components],
		});
	}

	_getComponents(mode: Mode): number[] {
		this._switchMode(mode);
		return [...this.components];
	}

	_getColorComponents(mode: Mode): number[] {
		return this._getComponents(mode).slice(0, 3);
	}

	_setComponents({
		mode,
		components,
		alpha,
	}: {
		mode: Mode;
		components: number[];
		alpha: boolean;
	}) {
		const alphaValue = alpha ? (components[3] ?? Number.NaN) : this.alpha;
		this._setData({
			mode,
			components: [...components.slice(0, 3), alphaValue],
		});
	}

	_getComponent(name: ComponentName): number {
		this._switchModeForComponent(name);
		const index = this._getComponentIndex(name);
		return this.components[index] as number;
	}

	_setComponent({ name, value }: { name: ComponentName; value: number }) {
		this._switchModeForComponent(name);
		const index = this._getComponentIndex(name);
		const clip = this._getComponentClip(name);
		this.components[index] = clip(value);
	}

	_getComponentIndex(name: ComponentName): number {
		const indexes: Record<ComponentName, number> = {
			red: 0,
			green: 1,
			blue: 2,
			hue: 0,
			saturation: 1,
			lightness: 2,
			value: 2,
			alpha: 3,
		};
		return indexes[name];
	}

	_getComponentClip(name: ComponentName): (value: number) => number {
		const clips: Record<ComponentName, (value: number) => number> = {
			red: clip255,
			green: clip255,
			blue: clip255,
			hue: clip360,
			saturation: clip1,
			lightness: clip1,
			value: clip1,
			alpha: clip1,
		};
		return clips[name];
	}

	_switchMode(mode: Mode) {
		if (this.mode === mode) {
			return;
		}

		const convert = conversions[`${this.mode}:${mode}`];
		if (!convert) {
			throw new Error(`Invalid mode ${mode}`);
		}

		this.components = convert(this.components) as Rgba;
		this.mode = mode;
	}

	_switchModeForComponent(name: ComponentName) {
		if (["red", "green", "blue"].includes(name)) {
			this._switchMode(Mode.rgb);
		}

		// Don't switch from HSL to HSV for no reason
		if (["hue", "saturation"].includes(name) && this.mode === Mode.rgb) {
			this._switchMode(Mode.hsl);
		}

		if (name === "lightness") {
			this._switchMode(Mode.hsl);
		}

		if (name === "value") {
			this._switchMode(Mode.hsv);
		}
	}

	// Get / set object
	get({
		mode = this.mode,
		abbreviated = false,
	}: {
		mode?: Mode;
		abbreviated?: boolean;
	} = {}): ColorObject {
		this._switchMode(mode);
		const names = componentNames({ mode, abbreviated });
		const obj: ColorObject = {};
		names.forEach((name, index) => {
			obj[name] = this.components[index];
		});
		return obj;
	}

	set(input: ColorObject) {
		const obj = charkeys(input);

		let mode: Mode;
		if (isRgb(obj)) {
			mode = Mode.rgb;
		} else if (isHsl(obj)) {
			mode = Mode.hsl;
		} else if (isHsv(obj)) {
			mode = Mode.hsv;
		} else {
			throw new Error("Invalid color format");
		}

		const names = componentNames({ mode, abbreviated: true });
		const components = names.map((name) => obj[name] as number);

		this._setData({ mode, components });
	}

	get a(): number {
		return this._getComponent("alpha");
	}
	get alpha(): number {
		return this._getComponent("alpha");
	}

	get r(): number {
		return this._getComponent("red");
	}
	get red(): number {
		return this._getComponent("red");
	}

	get g(): number {
		return this._getComponent("green");
	}
	get green(): number {
		return this._getComponent("green");
	}

	get b(): number {
		return this._getComponent("blue");
	}
	get blue(): number {
		return this._getComponent("blue");
	}

	get h(): number {
		return this._getComponent("hue");
	}
	get hue(): number {
		return this._getComponent("hue");
	}

	get s(): number {
		return this._getComponent("saturation");
	}
	get saturation(): number {
		return this._getComponent("saturation");
	}

	get v(): number {
		return this._getComponent("value");
	}
	get value(): number {
		return this._getComponent("value");
	}

	get l(): number {
		return this._getComponent("lightness");
	}
	get lightness(): number {
		return this._getComponent("lightness");
	}

	get rgba(): number[] {
		return this._getComponents(Mode.rgb);
	}

	get rgb(): number[] {
		return this._getColorComponents(Mode.rgb);
	}

	get hsla(): number[] {
		return this._getComponents(Mode.hsl);
	}

	get hsl(): number[] {
		return this._getColorComponents(Mode.hsl);
	}

	get hsva(): number[] {
		return this._getComponents(Mode.hsv);
	}

	get hsv(): number[] {
		return this._getColorComponents(Mode.hsv);
	}

	get hex(): string {
		this._switchMode(Mode.rgb);
		return rgbToHex(this.components);
	}

	get hex6(): string {
		return this.hex.slice(0, 7);
	}

	set a(value: number) {
		this._setComponent({ name: "alpha", value });
	}
	set alpha(value: number) {
		this._setComponent({ name: "alpha", value });
	}

	set r(value: number) {
		this._setComponent({ name: "red", value });
	}
	set red(value: number) {
		this._setComponent({ name: "red", value });
	}

	set g(value: number) {
		this._setComponent({ name: "green", value });
	}
	set green(value: number) {
		this._setComponent({ name: "green", value });
	}

	set b(value: number) {
		this._setComponent({ name: "blue", value });
	}
	set blue(value: number) {
		this._setComponent({ name: "blue", value });
	}

	set h(value: number) {
		this._setComponent({ name: "hue", value });
	}
	set hue(value: number) {
		this._setComponent({ name: "hue", value });
	}

	set s(value: number) {
		this._setComponent({ name: "saturation", value });
	}
	set saturation(value: number) {
		this._setComponent({ name: "saturation", value });
	}

	set v(value: number) {
		this._setComponent({ name: "value", value });
	}
	set value(value: number) {
		this._setComponent({ name: "value", value });
	}

	set l(value: number) {
		this._setComponent({ name: "lightness", value });
	}
	set lightness(value: number) {
		this._setComponent({ name: "lightness", value });
	}

	set rgb(components: number[]) {
		this._setComponents({
			mode: Mode.rgb,
			components,
			alpha: false,
		});
	}

	set rgba(components: number[]) {
		this._setComponents({
			mode: Mode.rgb,
			components,
			alpha: true,
		});
	}

	set hsl(components: number[]) {
		this._setComponents({
			mode: Mode.hsl,
			components,
			alpha: false,
		});
	}

	set hsla(components: number[]) {
		this._setData({
			mode: Mode.hsl,
			components,
		});
	}

	set hsv(components: number[]) {
		this._setComponents({
			mode: Mode.hsv,
			components,
			alpha: false,
		});
	}

	set hsva(components: number[]) {
		this._setData({
			mode: Mode.hsv,
			components,
		});
	}

	set hex(hex: string) {
		const components = hexToRgb(hex);
		this._setData({ mode: Mode.rgb, components });
	}

	css({
		format = "rgba",
		alpha = this.alpha,
	}: {
		format?: CssFormat;
		alpha?: number;
	} = {}): string {
		if (!["hex", "hsl", "hsla", "rgb", "rgba"].includes(format)) {
			throw new Error(`Unsupported css format: ${format}`);
		}

		if (format === "hex") {
			const components = [...this.rgb, alpha];
			return rgbToHex(components);
		}

		const mode = format.slice(0, 3) as Mode;
		const obj = this.get({ mode, abbreviated: true });
		if (format.includes("a")) {
			obj.a = alpha;
		} else {
			delete obj.a;
		}
		return colorToCss(obj);
	}

	toString(): string {
		return this.hex;
	}
}
