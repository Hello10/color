import {
  charkeys,
  clipper,
  defined,
  randomInt
} from '@hello10/util';

import {
  cssToColor,
  colorToCss,
  hexToRgb,
  hslToHsv,
  hslToRgb,
  hsvToHsl,
  hsvToRgb,
  rgbToHex,
  rgbToHsl,
  rgbToHsv
} from './converters';
import NamedColors from './NamedColors';
import checkComponents from './checkComponents';
import {
  isRgb,
  isHsv,
  isHsl,
  matchHexString,
  matchCssString
} from './matchers';
import {
  Mode,
  componentNames
} from './Mode';

const clip1 = clipper({min: 0, max: 1});
const clip255 = clipper({min: 0, max: 255});
const clip360 = clipper({min: 0, max: 360});

export default class Color {
  constructor (data) {
    this._setData(data);
  }

  _setData ({mode, components}) {
    if (!(mode && components)) {
      throw new Error('Must pass mode and components array');
    }

    if (!(mode in Mode)) {
      throw new Error(`Invalid mode ${mode}`);
    }

    checkComponents(components);

    const alpha = components[3];
    if (!defined(alpha) || Number.isNaN(alpha)) {
      components = [...components.slice(0, 3), 1.0];
    }

    let clips;
    if (mode === Mode.rgb) {
      clips = [clip255, clip255, clip255, clip1];
    } else {
      clips = [clip360, clip1, clip1, clip1];
    }

    this.components = components.map((value, index)=> clips[index](value));
    this.mode = mode;
  }

  static create (arg = {}) {
    if (Array.isArray(arg)) {
      return this.fromRgb(arg);
    } else if (arg.constructor === String) {
      return this.fromString(arg);
    } else if (Object.keys(arg).length) {
      if (isRgb(arg)) {
        return this.fromRgb(arg);
      } else if (isHsl(arg)) {
        return this.fromHsl(arg);
      } else if (isHsv(arg)) {
        return this.fromHsv(arg);
      }
    }
    throw new Error('Invalid color format. Must be RGB array, CSS string, or RGB/HSV/HSL object');
  }

  static fromString (str) {
    if (matchHexString(str)) {
      return this.fromHex(str);
    }

    if (matchCssString(str)) {
      return this.fromCss(str);
    }

    throw new Error(`Invalid string format: ${str}`);
  }

  static fromHex (str) {
    const components = hexToRgb(str);
    return this.fromRgb(components);
  }

  static fromCss (str) {
    const obj = cssToColor(str);
    return this.create(obj);
  }

  static fromRgb (arg) {
    let r;
    let g;
    let b;
    let a;

    if (Array.isArray(arg)) {
      checkComponents(arg);
      [r, g, b, a] = arg;
    } else if (isRgb(arg)) {
      ({r, g, b, a} = charkeys(arg));
    } else {
      throw new Error(`Invalid RGB format: ${arg}`);
    }

    return new this({
      mode: Mode.rgb,
      components: [r, g, b, a]
    });
  }

  static fromHsl (arg) {
    let h;
    let s;
    let l;
    let a;

    if (Array.isArray(arg)) {
      checkComponents(arg);
      [h, s, l, a] = arg;
    } else if (isHsl(arg)) {
      ({h, s, l, a} = charkeys(arg));
    } else {
      throw new Error(`Invalid HSL format: ${arg}`);
    }

    return new this({
      mode: Mode.hsl,
      components: [h, s, l, a]
    });
  }

  static fromHsv (arg) {
    let h;
    let s;
    let v;
    let a;

    if (Array.isArray(arg)) {
      checkComponents(arg);
      [h, s, v, a] = arg;
    } else if (isHsv(arg)) {
      ({h, s, v, a} = charkeys(arg));
    } else {
      throw new Error(`Invalid HSV format: ${arg}`);
    }

    return new this({
      mode: Mode.hsv,
      components: [h, s, v, a]
    });
  }

  static fromName (name) {
    if (!this.nameExists(name)) {
      throw new Error(`No color named ${name}`);
    }
    const rgb = NamedColors[name];
    return this.fromRgb(rgb);
  }

  static names () {
    return Object.keys(NamedColors);
  }

  static nameExists (name) {
    return (name in NamedColors);
  }

  static random () {
    const components = [];
    for (let i = 0; i < 3; i++) {
      const component = randomInt({max: 255});
      components.push(component);
    }

    return new this({
      mode: Mode.rgb,
      components
    });
  }

  shade (factor) {
    this.lightness -= factor;
    return this;
  }

  tint (factor) {
    this.lightness += factor;
    return this;
  }

  complement () {
    const {mode} = this;
    if (mode === Mode.rgb) {
      this.rgb = this.rgb.map((c)=> 255 - c);
    } else {
      this.hue = (this.hue + 180) % 360;
    }
    return this;
  }

  clone () {
    return new this.constructor({
      mode: this.mode,
      components: [...this.components]
    });
  }

  _getComponents (mode) {
    this._switchMode(mode);
    return [...this.components];
  }

  _getColorComponents (mode) {
    return this._getComponents(mode).slice(0, 3);
  }

  _setComponents ({mode, components, alpha}) {
    if (alpha) {
      // eslint-disable-next-line prefer-destructuring
      alpha = components[3];
    } else {
      ({alpha} = this);
    }
    components = [...components.slice(0, 3), alpha];
    this._setData({mode, components});
  }

  _getComponent (name) {
    this._switchModeForComponent(name);
    const index = this._getComponentIndex(name);
    return this.components[index];
  }

  _setComponent ({name, value}) {
    this._switchModeForComponent(name);
    const index = this._getComponentIndex(name);
    const clip = this._getComponentClip(name);
    this.components[index] = clip(value);
  }

  _getComponentIndex (name) {
    return {
      red: 0,
      green: 1,
      blue: 2,
      hue: 0,
      saturation: 1,
      lightness: 2,
      value: 2,
      alpha: 3
    }[name];
  }

  _getComponentClip (name) {
    return {
      red: clip255,
      green: clip255,
      blue: clip255,
      hue: clip360,
      saturation: clip1,
      lightness: clip1,
      value: clip1,
      alpha: clip1
    }[name];
  }

  _switchMode (mode) {
    if (!(mode in Mode) || (this.mode === mode)) {
      return;
    }

    let components;

    if (mode === Mode.rgb) {
      if (this.mode === Mode.hsl) {
        components = hslToRgb(this.components);
      }
      if (this.mode === Mode.hsv) {
        components = hsvToRgb(this.components);
      }
    }

    if (mode === Mode.hsv) {
      if (this.mode === Mode.rgb) {
        components = rgbToHsv(this.components);
      }
      if (this.mode === Mode.hsl) {
        components = hslToHsv(this.components);
      }
    }

    if (mode === Mode.hsl) {
      if (this.mode === Mode.rgb) {
        components = rgbToHsl(this.components);
      }
      if (this.mode === Mode.hsv) {
        components = hsvToHsl(this.components);
      }
    }

    this.components = components;
    this.mode = mode;
  }

  _switchModeForComponent (name) {
    if (['red', 'green', 'blue'].includes(name)) {
      this._switchMode(Mode.rgb);
    }

    // Don't switch from HSL to HSV for no reason
    if (['hue', 'saturation'].includes(name) && (this.mode === Mode.rgb)) {
      this._switchMode(Mode.hsl);
    }

    if (name === 'lightness') {
      this._switchMode(Mode.hsl);
    }

    if (name === 'value') {
      this._switchMode(Mode.hsv);
    }
  }

  // Get / set object
  get ({mode = this.mode, abbreviated = false} = {}) {
    this._switchMode(mode);
    const names = componentNames({mode, abbreviated});
    return names.reduce((obj, name, index)=> {
      obj[name] = this.components[index];
      return obj;
    }, {});
  }

  set (obj) {
    obj = charkeys(obj);

    let mode;
    if (isRgb(obj)) {
      mode = Mode.rgb;
    } else if (isHsl(obj)) {
      mode = Mode.hsl;
    } else if (isHsv(obj)) {
      mode = Mode.hsv;
    } else {
      throw new Error('Invalid color format');
    }

    const names = componentNames({mode, abbreviated: true});
    const components = names.map((name)=> {
      const k = name[0];
      return obj[k];
    });

    this._setData({mode, components});
  }

  get a () {
    return this._getComponent('alpha');
  }
  get alpha () {
    return this._getComponent('alpha');
  }

  get r () {
    return this._getComponent('red');
  }
  get red () {
    return this._getComponent('red');
  }

  get g () {
    return this._getComponent('green');
  }
  get green () {
    return this._getComponent('green');
  }

  get b () {
    return this._getComponent('blue');
  }
  get blue () {
    return this._getComponent('blue');
  }

  get h () {
    return this._getComponent('hue');
  }
  get hue () {
    return this._getComponent('hue');
  }

  get s () {
    return this._getComponent('saturation');
  }
  get saturation () {
    return this._getComponent('saturation');
  }

  get v () {
    return this._getComponent('value');
  }
  get value () {
    return this._getComponent('value');
  }

  get l () {
    return this._getComponent('lightness');
  }
  get lightness () {
    return this._getComponent('lightness');
  }

  get rgba () {
    return this._getComponents(Mode.rgb);
  }

  get rgb () {
    return this._getColorComponents(Mode.rgb);
  }

  get hsla () {
    return this._getComponents(Mode.hsl);
  }

  get hsl () {
    return this._getColorComponents(Mode.hsl);
  }

  get hsva () {
    return this._getComponents(Mode.hsv);
  }

  get hsv () {
    return this._getColorComponents(Mode.hsv);
  }

  get hex () {
    this._switchMode(Mode.rgb);
    return rgbToHex(this.components);
  }

  get hex6 () {
    return this.hex.slice(0, 7);
  }

  set a (value) {
    this._setComponent({name: 'alpha', value});
  }
  set alpha (value) {
    this._setComponent({name: 'alpha', value});
  }

  set r (value) {
    this._setComponent({name: 'red', value});
  }
  set red (value) {
    this._setComponent({name: 'red', value});
  }

  set g (value) {
    this._setComponent({name: 'green', value});
  }
  set green (value) {
    this._setComponent({name: 'green', value});
  }

  set b (value) {
    this._setComponent({name: 'blue', value});
  }
  set blue (value) {
    this._setComponent({name: 'blue', value});
  }

  set h (value) {
    this._setComponent({name: 'hue', value});
  }
  set hue (value) {
    this._setComponent({name: 'hue', value});
  }

  set s (value) {
    this._setComponent({name: 'saturation', value});
  }
  set saturation (value) {
    this._setComponent({name: 'saturation', value});
  }

  set v (value) {
    this._setComponent({name: 'value', value});
  }
  set value (value) {
    this._setComponent({name: 'value', value});
  }

  set l (value) {
    this._setComponent({name: 'lightness', value});
  }
  set lightness (value) {
    this._setComponent({name: 'lightness', value});
  }

  set rgb (components) {
    this._setComponents({
      mode: Mode.rgb,
      components,
      alpha: false
    });
  }

  set rgba (components) {
    this._setComponents({
      mode: Mode.rgb,
      components,
      alpha: true
    });
  }

  set hsl (components) {
    this._setComponents({
      mode: Mode.hsl,
      components,
      alpha: false
    });
  }

  set hsla (components) {
    this._setData({
      mode: Mode.hsl,
      components,
      alpha: true
    });
  }

  set hsv (components) {
    this._setComponents({
      mode: Mode.hsv,
      components,
      alpha: false
    });
  }

  set hsva (components) {
    this._setData({
      mode: Mode.hsv,
      components,
      alpha: true
    });
  }

  set hex (hex) {
    const components = hexToRgb(hex);
    this._setData({mode: Mode.rgb, components});
  }

  css ({format = 'rgba', alpha = this.alpha} = {}) {
    if (!['hex', 'hsl', 'hsla', 'rgb', 'rgba'].includes(format)) {
      throw new Error(`Unsupported css format: ${format}`);
    }

    if (format === 'hex') {
      const components = [...this.rgb, alpha];
      return rgbToHex(components);
    } else {
      const mode = format.slice(0, 3);
      const obj = this.get({mode, abbreviated: true});
      if (!format.includes('a')) {
        delete obj.a;
      }
      return colorToCss(obj);
    }
  }

  toString () {
    return this.hex;
  }
}
