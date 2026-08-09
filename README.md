# @hello10/color

Color class and conversion utilities — rgb / hsl / hsv / hex / css strings / named colors.

- ESM-only, fully typed (TypeScript)
- Mutable `Color` class that lazily switches between rgb / hsl / hsv modes as you read and write components
- Standalone converter functions if you don't need the class
- ~1000 named colors sourced from Wikipedia

## Install

```sh
pnpm add @hello10/color
```

## Quick start

```ts
import Color from "@hello10/color";

const purple = Color.create("#663399");
purple.lightness += 0.1;         // switches to hsl mode internally
purple.alpha = 0.5;
purple.css();                    // "rgba(133,66,199,0.5)"
purple.hex;                      // "#8542c780"
```

## Creating colors

`Color.create` accepts every supported input format and dispatches to the right constructor:

```ts
Color.create([102, 51, 153]);                            // rgb array
Color.create([102, 51, 153, 0.5]);                       // rgba array
Color.create("#639");                                    // 3-digit hex
Color.create("#663399");                                 // 6-digit hex
Color.create("#66339980");                               // 8-digit hex (alpha)
Color.create("rgb(102, 51, 153)");                       // css rgb
Color.create("rgba(102, 51, 153, 0.5)");                 // css rgba
Color.create("hsl(270, 50%, 40%)");                      // css hsl
Color.create("RebeccaPurple");                           // named color
Color.create({ red: 102, green: 51, blue: 153 });        // rgb object
Color.create({ r: 102, g: 51, b: 153, a: 0.5 });         // single-char keys
Color.create({ hue: 270, saturation: 0.5, lightness: 0.4 });  // hsl object
Color.create({ h: 270, s: 0.5, v: 0.6 });                // hsv object
```

Or use the specific constructors directly:

| Constructor | Input |
| --- | --- |
| `Color.fromRgb(arg)` | `[r, g, b, a?]` array or `{red, green, blue, alpha?}` / `{r, g, b, a?}` object |
| `Color.fromHsl(arg)` | `[h, s, l, a?]` array or `{hue, saturation, lightness, alpha?}` / `{h, s, l, a?}` object |
| `Color.fromHsv(arg)` | `[h, s, v, a?]` array or `{hue, saturation, value, alpha?}` / `{h, s, v, a?}` object |
| `Color.fromHex(str)` | `"#639"`, `"#663399"`, `"#66339980"` (leading `#` optional) |
| `Color.fromCss(str)` | `"rgb(...)"`, `"rgba(...)"`, `"hsl(...)"`, `"hsla(...)"` |
| `Color.fromName(name)` | Named color, e.g. `"BerkeleyBlue"` — throws if unknown |
| `Color.fromString(str)` | Hex, css, or name — tried in that order |
| `Color.random()` | Random opaque rgb color |
| `new Color({mode, components})` | Low-level: mode is `"rgb" \| "hsl" \| "hsv"`, components is `[c1, c2, c3, alpha?]` |

Component ranges: rgb channels are `0–255`, hue is `0–360`, and saturation / lightness / value / alpha are `0–1`. Values outside a component's range are clipped into it. A missing alpha defaults to `1`.

### Named colors

```ts
import Color, { NamedColors } from "@hello10/color";

Color.names();                   // ["AbsoluteZero", "AcidGreen", ..., "Zomp"]
Color.nameExists("BerkeleyBlue"); // true
NamedColors.BerkeleyBlue;        // [0, 50, 98]

const cal = Color.fromName("BerkeleyBlue");
cal.name;                        // "BerkeleyBlue" (only set by fromName)
```

## Reading and writing components

Every component is exposed as a getter/setter pair, in both full and single-character form:

| Full | Short | Range | Mode |
| --- | --- | --- | --- |
| `.red` | `.r` | 0–255 | rgb |
| `.green` | `.g` | 0–255 | rgb |
| `.blue` | `.b` | 0–255 | rgb |
| `.hue` | `.h` | 0–360 | hsl / hsv |
| `.saturation` | `.s` | 0–1 | hsl / hsv |
| `.lightness` | `.l` | 0–1 | hsl |
| `.value` | `.v` | 0–1 | hsv |
| `.alpha` | `.a` | 0–1 | any |

Accessing a component converts the color to a mode that has it, mutating in place — `.mode` tells you where it currently is:

```ts
const c = Color.create("#663399");
c.mode;       // "rgb"
c.lightness;  // 0.4 — converted to hsl to answer
c.mode;       // "hsl"
c.red = 200;  // converts back to rgb, then sets
c.mode;       // "rgb"
```

Whole-color accessors:

```ts
c.rgb;   // [r, g, b]         c.rgb  = [r, g, b];    (keeps current alpha)
c.rgba;  // [r, g, b, a]      c.rgba = [r, g, b, a];
c.hsl;   // [h, s, l]         c.hsl  = [h, s, l];    (keeps current alpha)
c.hsla;  // [h, s, l, a]      c.hsla = [h, s, l, a];
c.hsv;   // [h, s, v]         c.hsv  = [h, s, v];    (keeps current alpha)
c.hsva;  // [h, s, v, a]      c.hsva = [h, s, v, a];
c.hex;   // "#66339980"       c.hex  = "#639";
c.hex6;  // "#663399" (alpha stripped)
```

Object forms:

```ts
c.get();                                   // {red, green, blue, alpha} in current mode
c.get({ mode: "hsl" });                    // {hue, saturation, lightness, alpha}
c.get({ mode: "hsv", abbreviated: true }); // {h, s, v, a}

c.set({ hue: 250, saturation: 0.5, lightness: 0.4 });  // full or single-char keys
```

## Methods

```ts
c.shade(0.1);      // darken: lightness -= 0.1 (returns this, chainable)
c.tint(0.1);       // lighten: lightness += 0.1
c.complement();    // complementary color (hue + 180, or inverted rgb in rgb mode)
c.clone();         // independent copy
c.equals(other);   // accepts Color, hex/css/name string, array, or object;
                   // falsey values return false
c.toString();      // same as c.hex — works in template strings
```

### `css(options?)`

Render as a CSS color string:

```ts
const c = Color.fromName("BerkeleyBlue");

c.css();                                // "rgba(0,50,98,1)" — default format
c.css({ format: "rgb" });               // "rgb(0,50,98)"
c.css({ format: "hsl" });               // "hsl(209.39,100,19.22)"
c.css({ format: "hsla" });              // "hsla(209.39,100,19.22,1)"
c.css({ format: "hex" });               // "#003262ff"
c.css({ format: "hex", alpha: 0.5 });   // "#00326280" — override alpha per call
```

Formats: `"hex" | "rgb" | "rgba" | "hsl" | "hsla"`. Numbers are rounded to 2 decimals.

## Converters

The standalone conversion functions are available without the class (also as `Color.converters`):

```ts
import { converters } from "@hello10/color";

converters.rgbToHsl([102, 51, 153]);      // [270, 0.5, 0.4]
converters.rgbToHsv([102, 51, 153]);      // [270, 0.667, 0.6]
converters.rgbToHex([102, 51, 153]);      // "#663399"
converters.hslToRgb([270, 0.5, 0.4]);     // [102, 51, 153]
converters.hslToHsv([270, 0.5, 0.4]);     // [270, 0.667, 0.6]
converters.hsvToRgb([270, 0.667, 0.6]);   // [102, 51, 153]
converters.hsvToHsl([270, 0.667, 0.6]);   // [270, 0.5, 0.4]
converters.hexToRgb("#663399");           // [102, 51, 153]
converters.cssToColor("rgba(0,50,98,1)"); // {red: 0, green: 50, blue: 98, alpha: 1}
converters.colorToCss({ red: 0, green: 50, blue: 98 }); // "rgb(0,50,98)"
converters.hslToRgbAlt([270, 0.5, 0.4]);  // alternate hslToRgb implementation
```

All component-array converters accept 3 or 4 elements and preserve alpha when present.

## Types

```ts
import type {
	ColorData,      // {mode: Mode, components: number[]}
	ColorInput,     // string | number[] | ColorObject
	ColorObject,    // Record<string, number | undefined>
	Components,     // [number, number, number] | [number, number, number, number]
	CssFormat,      // "hex" | "hsl" | "hsla" | "rgb" | "rgba"
	Mode,           // "rgb" | "hsl" | "hsv"
} from "@hello10/color";
```

## Development

```sh
pnpm install
pnpm build      # tsup
pnpm test       # vitest
pnpm typecheck  # tsc --noEmit
pnpm lint       # biome
pnpm verify     # all of the above
```

## TODO

https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
