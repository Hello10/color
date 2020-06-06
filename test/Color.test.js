const Assert = require('assert');

const {
  betweener,
  charkeys,
  upto
} = require('@hello10/util');

const Color = require('../dist/index').default;

function assertValidRgb (color) {
  Assert.equal(color.mode, 'rgb');
  const validComponent = betweener('[0, 255]');
  Assert(color.rgb.every(validComponent));
}

function percent (num) {
  return Math.round(100 * num);
}

function colorsFromObjAndSingleCharVersion (obj) {
  return (fn)=> {
    const inputs = [
      obj,
      charkeys(obj)
    ];

    inputs
      .map((input)=> Color.create(input))
      .forEach(fn);
  };
}

describe('Color', ()=> {
  describe('constructor', ()=> {
    it('should require valid mode and components args', ()=> {
      const good_mode = 'rgb';
      const good_components = [10, 1, 1];
      const bad_mode = 'barf';
      const bad_components = [0];

      Assert.doesNotThrow(()=> {
        return new Color({
          mode: good_mode,
          components: good_components
        });
      });

      const bad_inputs = [
        {
          mode: good_mode
        },
        {
          components: good_components
        },
        {
          mode: good_mode,
          components: bad_components
        },
        {
          mode: bad_mode,
          components: good_components
        },
        [1, 2, 3],
        130,
        'fart'
      ];

      for (const bad_input of bad_inputs) {
        Assert.throws(()=> {
          return new Color(bad_input);
        });
      }
    });
  });

  describe('.create', ()=> {
    it('should fail on invalid input', ()=> {
      Assert.throws(()=> {
        Color.create(1234);
      });
    });
    it('should create color in rgb mode when passed array', ()=> {
      const rgb = [213, 20, 31];
      const color = Color.create(rgb);
      Assert.equal(color.mode, 'rgb');
      Assert.deepEqual(color.components, [...rgb, 1.0]);
    });

    it('should create color in rgb mode when hex string passed', ()=> {
      const hex = '#23f84900';
      const color = Color.create(hex);
      Assert.equal(color.mode, 'rgb');
      Assert.deepEqual(color.components, [35, 248, 73, 0]);
    });

    it('should create color in rgb mode when rgba css string passed', ()=> {
      const rgba_css = 'rgba(128, 127, 126, 0.5)';
      const color = Color.create(rgba_css);
      Assert.equal(color.mode, 'rgb');
      Assert.deepEqual(color.components, [128, 127, 126, 0.5]);
    });

    it('should create color in rgb mode when rgba css string passed', ()=> {
      const rgba_css = 'rgba(128, 127, 126, 0.5)';
      const color = Color.create(rgba_css);
      Assert.equal(color.mode, 'rgb');
      Assert.deepEqual(color.components, [128, 127, 126, 0.5]);
    });

    it('should create color in hsl mode when hsl css string passed', ()=> {
      const hsl_css = 'hsl(300, 100%, 50%)';
      const color = Color.create(hsl_css);
      Assert.equal(color.mode, 'hsl');
      Assert.deepEqual(color.components, [300, 1.0, 0.5, 1.0]);
    });

    it('should create color in rgb mode when rgb object passed', ()=> {
      const obj = {
        red: 200,
        green: 200,
        blue: 150,
        alpha: 0.5
      };
      colorsFromObjAndSingleCharVersion(obj)((color)=> {
        Assert.equal(color.mode, 'rgb');
        const expected = [obj.red, obj.green, obj.blue, obj.alpha];
        Assert.deepEqual(color.components, expected);
      });
    });

    it('should create color in hsl mode when hsl object passed', ()=> {
      const obj = {
        hue: 340,
        saturation: 0.5,
        lightness: 0.25
      };
      colorsFromObjAndSingleCharVersion(obj)((color)=> {
        Assert.equal(color.mode, 'hsl');
        const expected = [obj.hue, obj.saturation, obj.lightness, 1.0];
        Assert.deepEqual(color.components, expected);
      });
    });

    it('should create color in hsv mode when hsv object passed', ()=> {
      const obj = {
        hue: 190,
        saturation: 0.2,
        value: 0.8
      };
      colorsFromObjAndSingleCharVersion(obj)((color)=> {
        Assert.equal(color.mode, 'hsv');
        const expected = [obj.hue, obj.saturation, obj.value, 1.0];
        Assert.deepEqual(color.components, expected);
      });
    });
  });

  for (const format of ['Hsl', 'Hsv', 'Rgb']) {
    const fn = `from${format}`;
    const mode = format.toLowerCase();

    describe(fn, ()=> {
      it('should accept arrays', ()=> {
        const input = [240, 1, 1];
        const color = Color[fn](input);
        Assert.equal(color.mode, mode);
        Assert.deepEqual(color.components, [...input, 1.0]);
      });

      it('should throw on bad format', ()=> {
        const inputs = [
          [1, 2, 3, 4, 5],
          'farts',
          {}
        ];
        for (const input of inputs) {
          Assert.throws(()=> {
            Color[fn](input);
          });
        }
      });
    });
  }

  describe('.fromString', ()=> {
    it('should fail on bad string format', ()=> {
      Assert.throws(()=> {
        Color.fromString('fart');
      });
    });
  });

  describe('.fromName', ()=> {
    it('should create a color from a valid name', ()=> {
      const berkeley_rgb = [0, 50, 98];
      const color = Color.fromName('BerkeleyBlue');
      Assert.equal(color.mode, 'rgb');
      Assert.deepEqual(color.components, [...berkeley_rgb, 1.0]);
    });

    it('should error on invalid name', ()=> {
      Assert.throws(()=> {
        Color.fromName('BlueBarf');
      }, /No color named/);
    });
  });

  describe('.nameExists', ()=> {
    it('should test whether name exists', ()=> {
      Assert.equal(Color.nameExists('BerkeleyBlue'), true);
      Assert.equal(Color.nameExists('BarfBlue'), false);
    });
  });

  describe('.name', ()=> {
    it('should return a list of color names', ()=> {
      const names = Color.names();
      Assert(names.length > 0);
      Assert(names.includes('BerkeleyBlue'));
    });
  });


  describe('.random', ()=> {
    it('should return a valid rgb color', ()=> {
      upto(50)(()=> {
        const color = Color.random();
        assertValidRgb(color);
      });
    });
  });

  describe('.get', ()=> {
    it('should get color object', ()=> {
      const gray = Color.fromHex('#808080ff');
      Assert.deepEqual(gray.get(), {
        red: 128,
        green: 128,
        blue: 128,
        alpha: 1
      });
    });
  });

  describe('.set', ()=> {
    const sets = [
      {
        hue: 250,
        saturation: 1 / 3,
        lightness: 0.375
      },
      {
        hue: 250,
        saturation: 0.5,
        value: 0.5
      },
      {
        red: 74.375,
        green: 63.75,
        blue: 127.5
      }
    ];
    for (const set of sets) {
      const obj = charkeys(set);
      const mode = Object.keys(obj).join('');
      it(`should set with ${mode}`, ()=> {
        const color = Color.fromHex('#808080ff');
        color.set(obj);
        Assert.equal(color.hex6, '#4a4080', mode);
      });
    }

    it('should throw bad input', ()=> {
      Assert.throws(()=> {
        const color = Color.fromHex('#fff');
        color.set({barf: 100});
      }, /Invalid color format/);
    });
  });

  describe('getters', ()=> {
    it('should get', ()=> {
      const rphex = '#663399FF';
      const color = Color.create(rphex);

      Assert.equal(color.mode, 'rgb');
      Assert.equal(color.alpha, 1.0);
      Assert.equal(color.a, 1.0);
      Assert.equal(color.red, 102);
      Assert.equal(color.r, 102);
      Assert.equal(color.green, 51);
      Assert.equal(color.g, 51);
      Assert.equal(color.blue, 153);
      Assert.equal(color.b, 153);
      Assert.equal(color.mode, 'rgb');
      Assert.deepEqual(color.rgba, [102, 51, 153, 1.0]);
      Assert.deepEqual(color.rgb, [102, 51, 153]);

      // rgb -> hsl
      Assert.equal(color.hue, 270);
      Assert.equal(color.h, 270);
      Assert.equal(percent(color.saturation), 50);
      Assert.equal(percent(color.s), 50);
      Assert.equal(percent(color.lightness), 40);
      Assert.equal(percent(color.l), 40);
      Assert.equal(color.mode, 'hsl');
      Assert.deepEqual(color.hsla, [270, 0.49999999999999994, 0.4, 1]);
      Assert.deepEqual(color.hsl, [270, 0.49999999999999994, 0.4]);

      // hsl -> hsv
      Assert.equal(percent(color.value), 60);
      Assert.equal(percent(color.v), 60);
      Assert.equal(percent(color.saturation), 67);
      Assert.equal(percent(color.s), 67);
      Assert.equal(color.hue, 270);
      Assert.equal(color.h, 270);
      Assert.equal(color.mode, 'hsv');
      Assert.deepEqual(color.hsva, [270, 0.6666666666666665, 0.6, 1]);
      Assert.deepEqual(color.hsv, [270, 0.6666666666666665, 0.6]);

      // hsv -> hsl
      Assert.equal(percent(color.lightness), 40);
      Assert.equal(percent(color.l), 40);
      Assert.equal(color.mode, 'hsl');

      // hsl -> rgb
      Assert.equal(color.blue, 153);
      Assert.equal(color.mode, 'rgb');

      // rgb -> hsv
      Assert.equal(percent(color.value), 60);
      Assert.equal(percent(color.v), 60);
      Assert.equal(color.mode, 'hsv');

      // hsv -> rgb
      Assert.equal(color.red, 102);
      Assert.equal(color.mode, 'rgb');

      // test unsupported mode
      Assert.throws(()=> {
        color.switchMode('cmyk');
      });
    });
  });

  describe('setters', ()=> {
    it('should set', ()=> {
      const rphex = '#663399FF';
      const color = Color.create(rphex);

      color.alpha = 0.5;
      Assert.equal(color.a, 0.5);
      color.a = 0.75;
      Assert.equal(color.alpha, 0.75);

      color.red = 230;
      Assert.equal(color.r, 230);
      color.r = 120;
      Assert.equal(color.red, 120);

      color.blue = 285;
      Assert.equal(color.b, 255);
      color.b = -120;
      Assert.equal(color.blue, 0);

      color.green = 12;
      Assert.equal(color.g, 12);
      color.g = 24;
      Assert.equal(color.green, 24);

      color.hue = 215;
      Assert.equal(color.mode, 'hsl');
      Assert.equal(color.h, 215);
      color.h = 200;
      Assert.equal(color.hue, 200);

      color.saturation = 0.5;
      Assert.equal(color.s, 0.5);
      color.s = 0.75;
      Assert.equal(color.saturation, 0.75);

      color.lightness = 0.5;
      Assert.equal(color.l, 0.5);
      color.l = 0.75;
      Assert.equal(color.lightness, 0.75);
      color.value = 0.5;
      Assert.equal(color.mode, 'hsv');
      Assert.equal(color.v, 0.5);
      color.v = 0.75;
      Assert.equal(color.value, 0.75);
      color.hue = 215;
      Assert.equal(color.mode, 'hsv');
      Assert.equal(color.h, 215);

      color.rgba = [102, 51, 153, 0.5];
      Assert.equal(color.alpha, 0.5);
      Assert.equal(color.green, 51);
      color.rgb = [102, 102, 102];
      Assert.equal(color.alpha, 0.5);
      Assert.equal(color.blue, 102);

      color.hsla = [250, 0.5, 0.5, 0.5];
      Assert.equal(color.alpha, 0.5);
      Assert.equal(color.lightness, 0.5);
      color.hsl = [250, 0.75, 0.75];
      Assert.equal(color.alpha, 0.5);
      Assert.equal(color.saturation, 0.75);

      color.hsva = [250, 0.25, 0.25, 0.5];
      Assert.equal(color.alpha, 0.5);
      Assert.equal(color.value, 0.25);
      color.hsv = [250, 0.15, 0.85];
      Assert.equal(color.alpha, 0.5);
      Assert.equal(color.value, 0.85);

      color.hex = '#66339980';
      Assert.equal(color.hex6, '#663399');
      Assert.equal(color.hex, '#66339980');
      Assert.equal(color.mode, 'rgb');
      Assert.deepEqual(color.rgb, [102, 51, 153]);
    });
  });

  describe('.shade', ()=> {
    it('should darken the color', ()=> {
      const red = Color.fromHex('#ff0000');
      Assert.equal(red.lightness, 0.5);
      red.shade(0.1);
      Assert.equal(red.lightness, 0.4);
      Assert(red.red < 255);
    });
  });

  describe('.tint', ()=> {
    const black = Color.fromHex('#000000');
    Assert.equal(black.lightness, 0);
    black.tint(0.5);
    Assert.equal(black.lightness, 0.5);
    Assert.equal(black.hex6, '#808080');
  });

  describe('.complement', ()=> {
    it('should complement the color', ()=> {
      const red = Color.fromHex('#ff0000');
      const red_comp = red.clone().complement();
      const cyan = Color.fromHsv([180, 1.0, 1.0]);
      const cyan_comp = cyan.clone().complement();
      Assert.equal(red.hex, cyan_comp.hex);
      Assert.equal(cyan.hex, red_comp.hex);
    });
  });

  describe('.css', ()=> {
    const color = Color.fromName('BerkeleyBlue');

    it('should return css color declarations', ()=> {
      const expects = {
        hex: '#003262ff',
        hsl: 'hsl(209.39,100,19.22)',
        hsla: 'hsla(209.39,100,19.22,1)',
        rgb: 'rgb(0,50,98)',
        rgba: 'rgba(0,50,98,1)'
      };

      for (const [format, expect] of Object.entries(expects)) {
        const actual = color.css({format});
        Assert.equal(actual, expect, format);
      }
    });

    it('should default to rgba when no args passed', ()=> {
      const rgba = color.css();
      Assert.equal(rgba, 'rgba(0,50,98,1)');
    });

    it('should allow to override alpha', ()=> {
      const hex = color.css({format: 'hex', alpha: 0.5});
      Assert.equal(hex, '#00326280');
      const rgba = color.css({alpha: 0.5});
      Assert.equal(rgba, 'rgba(0,50,98,0.5)');
    });

    it('it should reject unsupported modes', ()=> {
      Assert.throws(()=> {
        color.css({format: 'cmyk'});
      }, /Unsupported/);
    });
  });

  describe('.toString', ()=> {
    const color = Color.fromName('BerkeleyBlue');
    it('should render hex as string', ()=> {
      Assert.equal(`Wow! ${color}`, 'Wow! #003262ff');
    });
  });
});
