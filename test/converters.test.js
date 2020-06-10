const Assert = require('assert');
const {rounder} = require('@hello10/util');

const Color = require('../dist/index');

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
  rgbToHsv
} = Color.converters;

const round5 = rounder({decimals: 5});

function roundDeepEqual (arr1, arr2, message) {
  function round5All (arr) {
    return arr.map(round5);
  }
  Assert.deepEqual(round5All(arr1), round5All(arr2), message);
}

function assertInterconvert ({to, from, input}) {
  const output = from(to(input));
  roundDeepEqual(output, input);
}

describe('converters', ()=> {
  describe('that accept components', ()=> {
    it('should fail on invalid components format', ()=> {
      const converts = [
        hslToHsv,
        hslToRgb,
        hsvToHsl,
        hsvToRgb,
        rgbToHex,
        rgbToHsl,
        rgbToHsv
      ];
      for (const convert of converts) {
        Assert.throws(()=> {
          convert([1, 2]);
        });
        Assert.throws(()=> {
          convert([1, 2, 3, 4, 5]);
        });
      }
    });
  });

  describe('colorToCss', ()=> {
    it('should convert a color object to css', ()=> {
      const css = colorToCss({
        red: 255,
        green: 255,
        blue: 255,
        alpha: 1.0
      });
      Assert.equal(css, 'rgba(255,255,255,1)');
    });

    it('should throw for unsupported format', ()=> {
      Assert.throws(()=> {
        colorToCss({
          h: 140,
          s: 0.5,
          v: 0.5,
          a: 1.0
        });
      });
    });
  });

  describe('cssToColor', ()=> {
    it('should convert css to color object', ()=> {
      const obj = cssToColor('rgba(255,255,255,1)');
      Assert.deepEqual(obj, {
        red: 255,
        green: 255,
        blue: 255,
        alpha: 1.0
      });
    });

    it('should throw for unsupported format', ()=> {
      Assert.throws(()=> {
        cssToColor('cmyk(100%, 0%, 0%, 0%)');
      });
    });
  });

  describe('hexToRgb', ()=> {
    it('should handle 3 value hex', ()=> {
      const rgb = hexToRgb('#fff');
      Assert.deepEqual(rgb, [255, 255, 255]);
    });

    it('should handle 6 value hex', ()=> {
      const rgb = hexToRgb('#f0f1f2');
      Assert.deepEqual(rgb, [240, 241, 242]);
    });

    it('should handle 8 value hex', ()=> {
      const rgb = hexToRgb('#000000ff');
      Assert.deepEqual(rgb, [0, 0, 0, 1.0]);
    });

    it('should fail on bad format', ()=> {
      Assert.throws(()=> {
        hexToRgb('#f');
      });
    });
  });

  describe('hexToRgb <=> rgbToHex', ()=> {
    it('should interconvert', ()=> {
      const inputs = [
        '#a4c639f0',
        '#030122',
        '#ffffffff',
        '#00000000'
      ];
      for (const input of inputs) {
        const rgb = hexToRgb(input);
        const hex = rgbToHex(rgb);
        Assert.equal(hex, input);
      }
    });
  });

  describe('hslToHsv <=> hsvToHsl', ()=> {
    it('should interconvert', ()=> {
      const inputs = [
        [205, 0.39, 0.60],
        [301, 1.0, 0.4, 1.0]
      ];
      for (const input of inputs) {
        assertInterconvert({
          to: hslToHsv,
          from: hsvToHsl,
          input
        });
        assertInterconvert({
          to: hsvToHsl,
          from: hslToHsv,
          input
        });
      }
    });

    it('has some information losing edge cases', ()=> {
      // when lightness / value are 0, interconversion loses information
      // TODO: is this avoidable without adding auxiliary data purely for the
      //       purposes of invertibility?
      const hsl_lightness0 = [280, 0.39, 0];
      Assert.deepEqual(hsvToHsl(hslToHsv(hsl_lightness0)), [280, 0, 0]);
      const hsv_value0 = [83, 0.56, 0];
      Assert.deepEqual(hslToHsv(hsvToHsl(hsv_value0)), [83, 0, 0]);
    });
  });

  describe('hslToRgb <=> rgbToHsl', ()=> {
    it('should interconvert from hsl to rgb and back', ()=> {
      const hsls = [
        [348, 0.78, 0.53],
        [127, 0.44, 0.88, 1.0],
        [0, 0.23, 0.45]
      ];
      for (const hsl of hsls) {
        assertInterconvert({
          to: hslToRgb,
          from: rgbToHsl,
          input: hsl
        });
      }
    });

    it('should interconvert from rgb to hsl and back', ()=> {
      const rgbs = [
        [243, 122, 84],
        [128, 128, 128, 0.5],
        [0, 0, 0],
        [255, 128, 0, 0.75]
      ];
      for (const rgb of rgbs) {
        assertInterconvert({
          to: rgbToHsl,
          from: hslToRgb,
          input: rgb
        });
      }
    });

    it('has some information losing edge cases', ()=> {
      // When lightness is 1 or 0, hue and saturation are set to 0
      // TODO: is this avoidable without adding auxiliary data purely for the
      //       purposes of invertibility?
      const hsl_lightness0 = [10, 0.5, 0];
      let hsl_output = rgbToHsl(hslToRgb(hsl_lightness0));
      Assert.deepEqual(hsl_output, [0, 0, 0]);

      const hsl_lightness1 = [250, 0.3, 1];
      hsl_output = rgbToHsl(hslToRgb(hsl_lightness1));
      Assert.deepEqual(hsl_output, [0, 0, 1]);
    });
  });

  describe('rgbToHsv <=> hsvToRgb', ()=> {
    it('should interconvert', ()=> {
      assertInterconvert({
        to: rgbToHsv,
        from: hsvToRgb,
        input: [114, 160, 194, 1.0]
      });
    });
  });

  describe('hex -> rgb -> hsv -> hsl -> rgb -> hex', ()=> {
    it('should end with same hex code we started with', ()=> {
      const input = '#a4c639f0';
      const output = rgbToHex(hslToRgb(hsvToHsl(rgbToHsv(hexToRgb(input)))));
      Assert.equal(input, output);
    });
  });
});
