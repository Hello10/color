import { hasAllCharkeys, charkeys, defined, rounder, randomInt, clipper } from '@hello10/util';

const Mode = {
  rgb: 'rgb',
  hsv: 'hsv',
  hsl: 'hsl'
};
function componentNames({
  mode,
  abbreviated
}) {
  let names = {
    [Mode.rgb]: ['red', 'green', 'blue', 'alpha'],
    [Mode.hsl]: ['hue', 'saturation', 'lightness', 'alpha'],
    [Mode.hsv]: ['hue', 'saturation', 'value', 'alpha']
  }[mode];

  if (abbreviated) {
    names = names.map(name => name[0]);
  }

  return names;
}

function matchCssString(str) {
  return str.match(/^(rgb|hsl)a?\(/i);
}
function matchHexString(str) {
  return str.match(/^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
}
const isRgb = hasAllCharkeys(['r', 'g', 'b']);
const isHsl = hasAllCharkeys(['h', 's', 'l']);
const isHsv = hasAllCharkeys(['h', 's', 'v']);

const round2 = rounder({
  decimals: 2
});
function colorToCss(obj) {
  obj = charkeys(obj);
  let fn;

  if (isRgb(obj)) {
    fn = 'rgb';
  } else if (isHsl(obj)) {
    fn = 'hsl';
  } else {
    throw new Error('Unsupported format');
  }

  const names = componentNames({
    mode: fn,
    abbreviated: true
  });
  let components = names.map(name => obj[name]);

  if (fn.includes('hs')) {
    components[1] *= 100;
    components[2] *= 100;
  }

  if (defined(obj.a)) {
    fn += 'a';
  } else {
    components = components.slice(0, 3);
  }

  components = components.map(round2);
  return `${fn}(${components.join(',')})`;
}

function cssToColor(str) {
  if (!matchCssString(str)) {
    throw new Error('Invalid css string');
  }

  const components = str.replace(/[^\d,.]/g, '').split(',');
  const is_hsl = str.includes('hsl');
  const names = is_hsl ? ['hue', 'saturation', 'lightness'] : ['red', 'green', 'blue'];
  const color = names.reduce((color, name, index) => {
    let value = parseFloat(components[index]);

    if (['saturation', 'lightness'].includes(name)) {
      value /= 100;
    }

    color[name] = value;
    return color;
  }, {});
  const has_alpha = str.includes('a');

  if (has_alpha) {
    color.alpha = parseFloat(components[3]);
  }

  return color;
}

function hexToRgb(str) {
  str = str.toLowerCase();

  if (!matchHexString(str)) {
    throw new Error('Invalid hex string');
  }

  const hex = str[0] === '#' ? str.slice(1) : str;
  const {
    length
  } = hex;
  let components;

  if (length === 3) {
    components = [0, 1, 2].map(i => parseInt(hex.charAt(i), 16) * 0x11);
  } else if (length === 6 || length === 8) {
    const offsets = [0, 2, 4];

    if (length === 8) {
      offsets.push(6);
    }

    components = offsets.map(i => parseInt(hex.substr(i, 2), 16));
  }

  if (components.length === 4) {
    components[3] /= 255;
  }

  return components;
}

function checkComponents(components) {
  const {
    length
  } = components;

  if (length < 3 || length > 4) {
    throw new Error('Components must have 3 or 4 elements');
  }
}

function hslToHsv(components) {
  checkComponents(components);
  const [hue, saturation_l, lightness, alpha] = components;
  const min_lightness = Math.min(lightness, 1 - lightness);
  const value = lightness + saturation_l * min_lightness;
  let saturation_v;

  if (value === 0) {
    saturation_v = 0;
  } else {
    saturation_v = 2 * (1 - lightness / value);
  }

  const new_components = [hue, saturation_v, value];

  if (alpha) {
    new_components.push(alpha);
  }

  return new_components;
}

function hslToRgb(components) {
  checkComponents(components);
  const [saturation, lightness, alpha] = components.slice(1);
  let hue = components[0];

  if (hue === 0) {
    hue = 360;
  }

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const offset = lightness - chroma / 2;
  const sector = hue / 60.0;
  const x = chroma * (1 - Math.abs(sector % 2 - 1));
  const sextant = Math.ceil(sector) - 1;
  let new_components = [[chroma, x, 0], [x, chroma, 0], [0, chroma, x], [0, x, chroma], [x, 0, chroma], [chroma, 0, x]][sextant] || [0, 0, 0];
  new_components = new_components.map(c => (c + offset) * 255);

  if (alpha) {
    new_components.push(alpha);
  }

  return new_components;
}

function hsvToHsl(components) {
  checkComponents(components);
  const [hue, saturation_v, value, alpha] = components;
  const lightness = value * (1 - saturation_v / 2);
  let saturation_l;

  if (lightness === 0 || lightness === 1) {
    saturation_l = 0;
  } else {
    const min_lightness = Math.min(lightness, 1 - lightness);
    saturation_l = (value - lightness) / min_lightness;
  }

  const new_components = [hue, saturation_l, lightness];

  if (alpha) {
    new_components.push(alpha);
  }

  return new_components;
}

function hsvToRgb(components) {
  checkComponents(components);
  const [hue, saturation, value, alpha] = components;
  const hue_sector = hue / 60.0;
  const sextant = Math.floor(hue_sector);
  const offset = hue_sector - sextant;
  const p = value * (1 - saturation) * 255;
  const q = value * (1 - saturation * offset) * 255;
  const t = value * (1 - saturation * (1 - offset)) * 255;
  const v = value * 255;
  const new_components = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][sextant % 6];

  if (alpha) {
    new_components.push(alpha);
  }

  return new_components;
}

function rgbToHex(components) {
  checkComponents(components);
  const values = components.slice(0, 3);

  if (components.length === 4) {
    values.push(components[3] * 255);
  }

  const hex_values = values.map(value => {
    let hex = Math.round(value).toString(16).toLowerCase();

    if (hex.length === 1) {
      hex = `0${hex}`;
    }

    return hex;
  });
  return `#${hex_values.join('')}`;
}

function rgbToHslOrHsv({
  components,
  mode
}) {
  checkComponents(components);
  const [red, green, blue] = components.slice(0, 3).map(c => c / 255.0);
  const alpha = components[3];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const value = max;
  const chroma = max - min;
  const lightness = (max + min) / 2.0;
  let hue;

  if (chroma === 0) {
    hue = 0;
  } else if (max === red) {
    hue = (green - blue) / chroma;
  } else if (max === green) {
    hue = (blue - red) / chroma + 2;
  } else if (max === blue) {
    hue = (red - green) / chroma + 4;
  }

  if (hue < 0) {
    hue += 6.0;
  }

  hue *= 60.0;
  let new_components;

  if (mode === 'hsl') {
    let saturation;

    if (lightness === 0 || lightness === 1) {
      saturation = 0;
    } else {
      saturation = chroma / (1 - Math.abs(2 * lightness - 1));
    }

    new_components = [hue, saturation, lightness];
  } else {
    const saturation = value === 0 ? 0 : chroma / value;
    new_components = [hue, saturation, value];
  }

  if (alpha) {
    new_components.push(alpha);
  }

  return new_components;
}

function rgbToHsl(components) {
  return rgbToHslOrHsv({
    components,
    mode: 'hsl'
  });
}

function rgbToHsv(components) {
  return rgbToHslOrHsv({
    components,
    mode: 'hsv'
  });
}



var converters = {
  __proto__: null,
  colorToCss: colorToCss,
  cssToColor: cssToColor,
  hexToRgb: hexToRgb,
  hslToHsv: hslToHsv,
  hslToRgb: hslToRgb,
  hsvToHsl: hsvToHsl,
  hsvToRgb: hsvToRgb,
  rgbToHex: rgbToHex,
  rgbToHsl: rgbToHsl,
  rgbToHsv: rgbToHsv
};

const NamedColors = {
  AbsoluteZero: [0, 72, 186],
  AcidGreen: [176, 191, 26],
  Aero: [124, 185, 232],
  AeroBlue: [192, 232, 213],
  AfricanViolet: [178, 132, 190],
  AirSuperiorityBlue: [114, 160, 193],
  Alabaster: [237, 234, 224],
  AliceBlue: [240, 248, 255],
  AlloyOrange: [196, 98, 16],
  Almond: [239, 222, 205],
  Amaranth: [229, 43, 80],
  AmaranthMP: [159, 43, 104],
  AmaranthPink: [241, 156, 187],
  AmaranthPurple: [171, 39, 79],
  AmaranthRed: [211, 33, 45],
  Amazon: [59, 122, 87],
  Amber: [255, 191, 0],
  AmberSAE: [255, 126, 0],
  Amethyst: [153, 102, 204],
  AndroidGreen: [164, 198, 57],
  AntiqueBrass: [205, 149, 117],
  AntiqueBronze: [102, 93, 30],
  AntiqueFuchsia: [145, 92, 131],
  AntiqueRuby: [132, 27, 45],
  AntiqueWhite: [250, 235, 215],
  Ao: [0, 128, 0],
  AppleGreen: [141, 182, 0],
  Apricot: [251, 206, 177],
  Aqua: [0, 255, 255],
  Aquamarine: [127, 255, 212],
  ArcticLime: [208, 255, 20],
  ArgentinianBlue: [108, 180, 238],
  ArmyGreen: [75, 83, 32],
  Artichoke: [143, 151, 121],
  ArtichokeGreen: [75, 111, 68],
  ArylideYellow: [233, 214, 107],
  AshGray: [178, 190, 181],
  Asparagus: [135, 169, 107],
  AtomicTangerine: [255, 153, 102],
  Auburn: [165, 42, 42],
  Aureolin: [253, 238, 0],
  Avocado: [86, 130, 3],
  Azure: [0, 127, 255],
  AzureX11: [240, 255, 255],
  BabyBlue: [137, 207, 240],
  BabyBlueEyes: [161, 202, 241],
  BabyPink: [244, 194, 194],
  BabyPowder: [254, 254, 250],
  BakerMillerPink: [255, 145, 175],
  BananaMania: [250, 231, 181],
  BarbiePink: [218, 24, 132],
  BarnRed: [124, 10, 2],
  BattleshipGrey: [132, 132, 130],
  BeauBlue: [188, 212, 230],
  Beaver: [159, 129, 112],
  Beige: [245, 245, 220],
  BerkeleyBlue: [0, 50, 98],
  BdazzledBlue: [46, 88, 148],
  BigDipORuby: [156, 37, 66],
  Bisque: [255, 228, 196],
  Bistre: [61, 43, 31],
  BistreBrown: [150, 113, 23],
  BitterLemon: [202, 224, 13],
  BitterLime: [191, 255, 0],
  Bittersweet: [254, 111, 94],
  BittersweetShimmer: [191, 79, 81],
  Black: [0, 0, 0],
  BlackBean: [61, 12, 2],
  BlackChocolate: [27, 24, 17],
  BlackCoffee: [59, 47, 47],
  BlackCoral: [84, 98, 111],
  BlackOlive: [59, 60, 54],
  BlackShadows: [191, 175, 178],
  BlanchedAlmond: [255, 235, 205],
  BlastOffBronze: [165, 113, 100],
  BleuDeFrance: [49, 140, 231],
  BlizzardBlue: [172, 229, 238],
  Blond: [250, 240, 190],
  BloodRed: [102, 0, 0],
  Blue: [0, 0, 255],
  BlueCrayola: [31, 117, 254],
  BlueMunsell: [0, 147, 175],
  BlueNCS: [0, 135, 189],
  BluePantone: [0, 24, 168],
  BluePigment: [51, 51, 153],
  BlueRYB: [2, 71, 254],
  BlueBell: [162, 162, 208],
  BlueGray: [102, 153, 204],
  BlueGreen: [13, 152, 186],
  BlueGreenColorWheel: [6, 78, 64],
  BlueJeans: [93, 173, 236],
  BlueSapphire: [18, 97, 128],
  BlueViolet: [138, 43, 226],
  BlueVioletCrayola: [115, 102, 189],
  BlueVioletColorWheel: [77, 26, 127],
  BlueYonder: [80, 114, 167],
  Bluetiful: [60, 105, 231],
  Blush: [222, 93, 131],
  Bole: [121, 68, 59],
  Bone: [227, 218, 201],
  BottleGreen: [0, 106, 78],
  Brandy: [135, 65, 63],
  BrickRed: [203, 65, 84],
  BrightGreen: [102, 255, 0],
  BrightLilac: [216, 145, 239],
  BrightMaroon: [195, 33, 72],
  BrightMint: [79, 255, 176],
  BrightNavyBlue: [25, 116, 210],
  BrightYellow: [255, 170, 29],
  BrightYellowCrayola: [255, 170, 29],
  BrilliantRose: [255, 85, 163],
  BrinkPink: [251, 96, 127],
  BritishRacingGreen: [0, 66, 37],
  Bronze: [205, 127, 50],
  Brown: [136, 84, 11],
  Brown2: [150, 75, 0],
  BrownSugar: [175, 110, 77],
  BrunswickGreen: [27, 77, 62],
  BudGreen: [123, 182, 97],
  Buff: [240, 220, 130],
  Burgundy: [128, 0, 32],
  Burlywood: [222, 184, 135],
  BurnishedBrown: [161, 122, 116],
  BurntOrange: [204, 85, 0],
  BurntOrange2: [191, 87, 0],
  BurntSienna: [233, 116, 81],
  BurntUmber: [138, 51, 36],
  Butterscotch: [224, 149, 64],
  Byzantine: [189, 51, 164],
  Byzantium: [112, 41, 99],
  Cadet: [83, 104, 114],
  CadetBlue: [95, 158, 160],
  CadetBlueCrayola: [169, 178, 195],
  CadetGrey: [145, 163, 176],
  CadmiumGreen: [0, 107, 60],
  CadmiumOrange: [237, 135, 45],
  CadmiumRed: [227, 0, 34],
  CadmiumYellow: [255, 246, 0],
  CafeAuLait: [166, 123, 91],
  CafeNoir: [75, 54, 33],
  CambridgeBlue: [163, 193, 173],
  Camel: [193, 154, 107],
  CameoPink: [239, 187, 204],
  Canary: [255, 255, 153],
  CanaryYellow: [255, 239, 0],
  CanaryYellow2: [255, 255, 153],
  CandyAppleRed: [255, 8, 0],
  CandyPink: [228, 113, 122],
  Capri: [0, 191, 255],
  CaputMortuum: [89, 39, 32],
  Cardinal: [196, 30, 58],
  CaribbeanGreen: [0, 204, 153],
  Carmine: [150, 0, 24],
  CarmineMP: [215, 0, 64],
  CarnationPink: [255, 166, 201],
  Carnelian: [179, 27, 27],
  CarolinaBlue: [86, 160, 211],
  CarrotOrange: [237, 145, 33],
  CastletonGreen: [0, 86, 63],
  CastletonGreen2: [0, 86, 59],
  Catawba: [112, 54, 66],
  CedarChest: [201, 90, 73],
  Celadon: [172, 225, 175],
  CeladonBlue: [0, 123, 167],
  CeladonGreen: [47, 132, 124],
  Celeste: [178, 255, 255],
  CelticBlue: [36, 107, 206],
  Cerise: [222, 49, 99],
  Cerulean: [0, 123, 167],
  CeruleanBlue: [42, 82, 190],
  CeruleanFrost: [109, 155, 195],
  CeruleanCrayola: [29, 172, 214],
  CGBlue: [0, 122, 165],
  CGRed: [224, 60, 49],
  Champagne: [247, 231, 206],
  ChampagnePink: [241, 221, 207],
  Charcoal: [54, 69, 79],
  CharlestonGreen: [35, 43, 43],
  CharmPink: [230, 143, 172],
  ChartreuseTraditional: [223, 255, 0],
  ChartreuseWeb: [127, 255, 0],
  CherryBlossomPink: [255, 183, 197],
  Chestnut: [149, 69, 53],
  ChiliRed: [226, 61, 40],
  ChinaPink: [222, 111, 161],
  ChinaRose: [168, 81, 110],
  ChineseRed: [170, 56, 30],
  ChineseViolet: [133, 96, 136],
  ChineseYellow: [255, 178, 0],
  ChocolateCosmos: [88, 17, 26],
  ChocolateTraditional: [123, 63, 0],
  ChocolateWeb: [210, 105, 30],
  ChromeYellow: [255, 167, 0],
  Cinereous: [152, 129, 123],
  Cinnabar: [227, 66, 52],
  Cinnabar2: [228, 77, 48],
  CinnamonSatin: [205, 96, 126],
  Citrine: [228, 208, 10],
  Citron: [159, 169, 31],
  CitrusLimeGreen: [192, 255, 0],
  Claret: [127, 23, 52],
  CobaltBlue: [0, 71, 171],
  CocoaBrown: [210, 105, 30],
  Coffee: [111, 78, 55],
  ColumbiaBlue: [185, 217, 235],
  CongoPink: [248, 131, 121],
  CoolGrey: [140, 146, 172],
  Copper: [184, 115, 51],
  CopperCrayola: [218, 138, 103],
  CopperPenny: [173, 111, 105],
  CopperRed: [203, 109, 81],
  CopperRose: [153, 102, 102],
  Coquelicot: [255, 56, 0],
  Coral: [255, 127, 80],
  CoralPink: [248, 131, 121],
  Cordovan: [137, 63, 69],
  Corn: [251, 236, 93],
  CornellRed: [179, 27, 27],
  CornflowerBlue: [100, 149, 237],
  Cornsilk: [255, 248, 220],
  CosmicCobalt: [46, 45, 136],
  CosmicLatte: [255, 248, 231],
  CoyoteBrown: [129, 97, 60],
  CottonCandy: [255, 188, 217],
  Cream: [255, 253, 208],
  Cream2: [255, 255, 204],
  Crimson: [220, 20, 60],
  CrimsonUA: [158, 27, 50],
  Cultured: [245, 245, 245],
  Cyan: [0, 255, 255],
  CyanProcess: [0, 183, 235],
  CyberGrape: [88, 66, 124],
  CyberYellow: [255, 211, 0],
  Cyclamen: [245, 111, 161],
  DarkBlue: [0, 0, 139],
  DarkBlueGray: [102, 102, 153],
  DarkBrown: [101, 67, 33],
  DarkByzantium: [93, 57, 84],
  DarkCornflowerBlue: [38, 66, 139],
  DarkCyan: [0, 139, 139],
  DarkElectricBlue: [83, 104, 120],
  DarkGoldenrod: [184, 134, 11],
  DarkGreen: [1, 50, 32],
  DarkGreenX11: [0, 100, 0],
  DarkJungleGreen: [26, 36, 33],
  DarkKhaki: [189, 183, 107],
  DarkLava: [72, 60, 50],
  DarkLiver: [83, 75, 79],
  DarkLiverHorses: [84, 61, 55],
  DarkMagenta: [139, 0, 139],
  DarkMossGreen: [74, 93, 35],
  DarkOliveGreen: [85, 107, 47],
  DarkOrange: [255, 140, 0],
  DarkOrchid: [153, 50, 204],
  DarkPastelGreen: [3, 192, 60],
  DarkPurple: [48, 25, 52],
  DarkRed: [139, 0, 0],
  DarkSalmon: [233, 150, 122],
  DarkSeaGreen: [143, 188, 143],
  DarkSienna: [60, 20, 20],
  DarkSkyBlue: [140, 190, 214],
  DarkSlateBlue: [72, 61, 139],
  DarkSlateGray: [47, 79, 79],
  DarkSpringGreen: [23, 114, 69],
  DarkTurquoise: [0, 206, 209],
  DarkViolet: [148, 0, 211],
  DartmouthGreen: [0, 112, 60],
  DartmouthGreen2: [0, 105, 62],
  DavysGrey: [85, 85, 85],
  DeepCerise: [218, 50, 135],
  DeepChampagne: [250, 214, 165],
  DeepChestnut: [185, 78, 72],
  DeepJungleGreen: [0, 75, 73],
  DeepPink: [255, 20, 147],
  DeepSaffron: [255, 153, 51],
  DeepSkyBlue: [0, 191, 255],
  DeepSpaceSparkle: [74, 100, 108],
  DeepTaupe: [126, 94, 96],
  DelftBlue: [31, 48, 94],
  Denim: [21, 96, 189],
  DenimBlue: [34, 67, 182],
  Desert: [193, 154, 107],
  DesertSand: [237, 201, 175],
  DimGray: [105, 105, 105],
  DodgerBlue: [30, 144, 255],
  DogwoodRose: [215, 24, 104],
  Drab: [150, 113, 23],
  DuckBlue: [0, 119, 145],
  DukeBlue: [0, 0, 156],
  DutchWhite: [239, 223, 187],
  EarthYellow: [225, 169, 95],
  Ebony: [85, 93, 80],
  Ecru: [194, 178, 128],
  EerieBlack: [27, 27, 27],
  Eggplant: [97, 64, 81],
  Eggshell: [240, 234, 214],
  EgyptianBlue: [16, 52, 166],
  ElectricBlue: [125, 249, 255],
  ElectricGreen: [0, 255, 0],
  ElectricIndigo: [111, 0, 255],
  ElectricLime: [204, 255, 0],
  ElectricPurple: [191, 0, 255],
  ElectricViolet: [143, 0, 255],
  Emerald: [80, 200, 120],
  Eminence: [108, 48, 130],
  EnglishGreen: [27, 77, 62],
  EnglishLavender: [180, 131, 149],
  EnglishRed: [171, 75, 82],
  EnglishVermillion: [204, 71, 75],
  EnglishViolet: [86, 60, 92],
  Erin: [0, 255, 64],
  EtonBlue: [150, 200, 162],
  Fallow: [193, 154, 107],
  FaluRed: [128, 24, 24],
  Fandango: [181, 51, 137],
  FandangoPink: [222, 82, 133],
  FashionFuchsia: [244, 0, 161],
  Fawn: [229, 170, 112],
  Feldgrau: [77, 93, 83],
  Fern: [113, 188, 120],
  FernGreen: [79, 121, 66],
  FieldDrab: [108, 84, 30],
  FieryRose: [255, 84, 112],
  Firebrick: [178, 34, 34],
  FireEngineRed: [206, 32, 41],
  FireOpal: [233, 92, 75],
  Flame: [226, 88, 34],
  Flax: [238, 220, 130],
  Flirt: [162, 0, 109],
  FloralWhite: [255, 250, 240],
  FluorescentBlue: [21, 244, 238],
  ForestGreenCrayola: [95, 167, 119],
  ForestGreenTraditional: [1, 68, 33],
  ForestGreenWeb: [34, 139, 34],
  FrenchBeige: [166, 123, 91],
  FrenchBistre: [133, 109, 77],
  FrenchBlue: [0, 114, 187],
  FrenchFuchsia: [253, 63, 146],
  FrenchLilac: [134, 96, 142],
  FrenchLime: [158, 253, 56],
  FrenchMauve: [212, 115, 212],
  FrenchPink: [253, 108, 158],
  FrenchRaspberry: [199, 44, 72],
  FrenchRose: [246, 74, 138],
  FrenchSkyBlue: [119, 181, 254],
  FrenchViolet: [136, 6, 206],
  Frostbite: [233, 54, 167],
  Fuchsia: [255, 0, 255],
  FuchsiaCrayola: [193, 84, 193],
  FuchsiaPurple: [204, 57, 123],
  FuchsiaRose: [199, 67, 117],
  Fulvous: [228, 132, 0],
  FuzzyWuzzy: [135, 66, 31],
  Gainsboro: [220, 220, 220],
  Gamboge: [228, 155, 15],
  GenericViridian: [0, 127, 102],
  GhostWhite: [248, 248, 255],
  GiantsOrange: [254, 90, 29],
  Glaucous: [96, 130, 182],
  GlossyGrape: [171, 146, 179],
  GOGreen: [0, 171, 102],
  Gold: [165, 124, 0],
  GoldMetallic: [212, 175, 55],
  GoldWeb: [255, 215, 0],
  GoldCrayola: [230, 190, 138],
  GoldFusion: [133, 117, 78],
  GoldenBrown: [153, 101, 21],
  GoldenPoppy: [252, 194, 0],
  GoldenYellow: [255, 223, 0],
  Goldenrod: [218, 165, 32],
  GothamGreen: [0, 87, 63],
  GraniteGray: [103, 103, 103],
  GrannySmithApple: [168, 228, 160],
  Gray: [128, 128, 128],
  GrayX11: [190, 190, 190],
  Green: [0, 255, 0],
  GreenX11: [0, 255, 0],
  GreenCrayola: [28, 172, 120],
  GreenEarth: [218, 221, 152],
  GreenWeb: [0, 128, 0],
  GreenMunsell: [0, 168, 119],
  GreenNCS: [0, 159, 107],
  GreenPantone: [0, 173, 67],
  GreenPigment: [0, 165, 80],
  GreenRYB: [102, 176, 50],
  GreenBlue: [17, 100, 180],
  GreenBlueCrayola: [40, 135, 200],
  GreenCyan: [0, 153, 102],
  GreenishYellow: [238, 234, 98],
  GreenLizard: [167, 244, 50],
  GreenSheen: [110, 174, 161],
  GreenYellow: [173, 255, 47],
  GreenYellowCrayola: [240, 232, 145],
  Grullo: [169, 154, 134],
  Gunmetal: [42, 52, 57],
  HanBlue: [68, 108, 207],
  HanPurple: [82, 24, 250],
  HansaYellow: [233, 214, 107],
  Harlequin: [63, 255, 0],
  HarvestGold: [218, 145, 0],
  HeatWave: [255, 122, 0],
  Heliotrope: [223, 115, 255],
  HeliotropeGray: [170, 152, 169],
  HollywoodCerise: [244, 0, 161],
  Honeydew: [240, 255, 240],
  HonoluluBlue: [0, 109, 176],
  HookersGreen: [73, 121, 107],
  HotMagenta: [255, 29, 206],
  HotPink: [255, 105, 180],
  HunterGreen: [53, 94, 59],
  HunyadiYellow: [231, 172, 65],
  Iceberg: [113, 166, 210],
  IceBlue: [153, 255, 255],
  Icterine: [252, 247, 94],
  IlluminatingEmerald: [49, 145, 119],
  ImperialRed: [237, 41, 57],
  Inchworm: [178, 236, 93],
  Independence: [76, 81, 109],
  IndiaGreen: [19, 136, 8],
  IndianRed: [205, 92, 92],
  IndianYellow: [227, 168, 87],
  Indigo: [75, 0, 130],
  IndigoDye: [0, 65, 106],
  InternationalOrange: [234, 75, 55],
  InternationalOrangeAaerospace: [255, 79, 0],
  InternationalOrangeEngineering: [186, 22, 12],
  InternationalOrangeGoldenGateBridge: [192, 54, 44],
  Iris: [90, 79, 207],
  Irresistible: [179, 68, 108],
  Isabelline: [244, 240, 236],
  IslamicGreen: [0, 144, 0],
  ItalianSkyBlue: [178, 255, 255],
  Ivory: [255, 255, 240],
  Jade: [0, 168, 107],
  JapaneseCarmine: [157, 41, 51],
  JapaneseViolet: [91, 50, 86],
  Jasmine: [248, 222, 126],
  Jasper: [208, 83, 64],
  JazzberryJam: [165, 11, 94],
  Jet: [52, 52, 52],
  Jonquil: [244, 202, 22],
  JuneBud: [189, 218, 87],
  JungleGreen: [41, 171, 135],
  KellyGreen: [76, 187, 23],
  Keppel: [58, 176, 158],
  KeyLime: [232, 244, 140],
  Khaki: [195, 176, 145],
  KhakiX11: [240, 230, 140],
  KleinBlue: [0, 47, 167],
  Kobe: [136, 45, 23],
  Kobi: [231, 159, 196],
  Kobicha: [107, 68, 35],
  KombuGreen: [53, 66, 48],
  KSUPurple: [81, 40, 136],
  LanguidLavender: [214, 202, 221],
  LapisLazuli: [38, 97, 156],
  LaserLemon: [255, 255, 102],
  LaurelGreen: [169, 186, 157],
  Lava: [207, 16, 32],
  LavenderFloral: [181, 126, 220],
  LavenderWeb: [230, 230, 250],
  LavenderBlue: [204, 204, 255],
  LavenderBlush: [255, 240, 245],
  LavenderGray: [196, 195, 208],
  LawnGreen: [124, 252, 0],
  Lemon: [255, 247, 0],
  Lemon2: [253, 255, 0],
  LemonChiffon: [255, 250, 205],
  LemonCurry: [204, 160, 29],
  LemonGlacier: [253, 255, 0],
  LemonMeringue: [246, 234, 190],
  LemonYellow: [255, 244, 79],
  LemonYellowCrayola: [255, 255, 159],
  Liberty: [84, 90, 167],
  LightBlue: [173, 216, 230],
  LightCoral: [240, 128, 128],
  LightCornflowerBlue: [147, 204, 234],
  LightCyan: [224, 255, 255],
  LightFrenchBeige: [200, 173, 127],
  LightGoldenrodYellow: [250, 250, 210],
  LightGray: [211, 211, 211],
  LightGreen: [144, 238, 144],
  LightOrange: [254, 216, 177],
  LightPeriwinkle: [197, 203, 225],
  LightPink: [255, 182, 193],
  LightRed: [255, 127, 127],
  LightSalmon: [255, 160, 122],
  LightSeaGreen: [32, 178, 170],
  LightSkyBlue: [135, 206, 250],
  LightSlateGray: [119, 136, 153],
  LightSteelBlue: [176, 196, 222],
  LightYellow: [255, 255, 224],
  Lilac: [200, 162, 200],
  LilacLuster: [174, 152, 170],
  LimeColorWheel: [191, 255, 0],
  Lime: [0, 255, 0],
  LimeGreen: [50, 205, 50],
  LincolnGreen: [25, 89, 5],
  Linen: [250, 240, 230],
  Lion: [193, 154, 107],
  LiseranPurple: [222, 111, 161],
  LittleBoyBlue: [108, 160, 220],
  Liver: [103, 76, 71],
  LiverDogs: [184, 109, 41],
  LiverOrgan: [108, 46, 31],
  LiverChestnut: [152, 116, 86],
  Livid: [102, 153, 204],
  Lust: [230, 32, 32],
  MacaroniAndCheese: [255, 189, 136],
  Madder: [165, 0, 33],
  MadderLake: [204, 51, 54],
  Magenta: [255, 0, 255],
  MagentaCrayola: [246, 83, 166],
  MagentaDye: [202, 31, 123],
  MagentaPantone: [208, 65, 126],
  MagentaProcess: [255, 0, 144],
  MagentaHaze: [159, 69, 118],
  MagicMint: [170, 240, 209],
  Magnolia: [242, 232, 215],
  Mahogany: [192, 64, 0],
  Maize: [251, 236, 93],
  MaizeCrayola: [242, 198, 73],
  MajorelleBlue: [96, 80, 220],
  Malachite: [11, 218, 81],
  Manatee: [151, 154, 170],
  Mandarin: [243, 122, 72],
  Mango: [253, 190, 2],
  MangoTango: [255, 130, 67],
  Mantis: [116, 195, 101],
  MardiGras: [136, 0, 133],
  Marigold: [234, 162, 33],
  MaroonCrayola: [195, 33, 72],
  MaroonWeb: [128, 0, 0],
  MaroonX11: [176, 48, 96],
  Mauve: [224, 176, 255],
  MauveTaupe: [145, 95, 109],
  Mauvelous: [239, 152, 170],
  MaximumBlue: [71, 171, 204],
  MaximumBlueGreen: [48, 191, 191],
  MaximumBluePurple: [172, 172, 230],
  MaximumGreen: [94, 140, 49],
  MaximumGreenYellow: [217, 230, 80],
  MaximumPurple: [115, 51, 128],
  MaximumRed: [217, 33, 33],
  MaximumRedPurple: [166, 58, 121],
  MaximumYellow: [250, 250, 55],
  MaximumYellowRed: [242, 186, 73],
  MayGreen: [76, 145, 65],
  MayaBlue: [115, 194, 251],
  MediumAquamarine: [102, 221, 170],
  MediumBlue: [0, 0, 205],
  MediumCandyAppleRed: [226, 6, 44],
  MediumCarmine: [175, 64, 53],
  MediumChampagne: [243, 229, 171],
  MediumOrchid: [186, 85, 211],
  MediumPurple: [147, 112, 219],
  MediumSeaGreen: [60, 179, 113],
  MediumSlateBlue: [123, 104, 238],
  MediumSpringGreen: [0, 250, 154],
  MediumTurquoise: [72, 209, 204],
  MediumVioletRed: [199, 21, 133],
  MellowApricot: [248, 184, 120],
  MellowYellow: [248, 222, 126],
  Melon: [254, 186, 173],
  Melon2: [253, 188, 180],
  MetallicGold: [211, 175, 55],
  MetallicSeaweed: [10, 126, 140],
  MetallicSunburst: [156, 124, 56],
  MexicanPink: [228, 0, 124],
  MiddleBlue: [126, 212, 230],
  MiddleBlueGreen: [141, 217, 204],
  MiddleBluePurple: [139, 114, 190],
  MiddleGrey: [139, 134, 128],
  MiddleGreen: [77, 140, 87],
  MiddleGreenYellow: [172, 191, 96],
  MiddlePurple: [217, 130, 181],
  MiddleRed: [229, 142, 115],
  MiddleRedPurple: [165, 83, 83],
  MiddleYellow: [255, 235, 0],
  MiddleYellowRed: [236, 177, 118],
  Midnight: [112, 38, 112],
  MidnightBlue: [25, 25, 112],
  MidnightGreen: [0, 73, 83],
  MikadoYellow: [255, 196, 12],
  MimiPink: [255, 218, 233],
  Mindaro: [227, 249, 136],
  Ming: [54, 116, 125],
  MinionYellow: [245, 224, 80],
  Mint: [62, 180, 137],
  MintCream: [245, 255, 250],
  MintGreen: [152, 255, 152],
  MistyMoss: [187, 180, 119],
  MistyRose: [255, 228, 225],
  ModeBeige: [150, 113, 23],
  MorningBlue: [141, 163, 153],
  MossGreen: [138, 154, 91],
  MountainMeadow: [48, 186, 143],
  MountbattenPink: [153, 122, 141],
  MSUGreen: [24, 69, 59],
  Mulberry: [197, 75, 140],
  MulberryCrayola: [200, 80, 155],
  Mustard: [255, 219, 88],
  MyrtleGreen: [49, 120, 115],
  Mystic: [214, 82, 130],
  MysticMaroon: [173, 67, 121],
  NadeshikoPink: [246, 173, 198],
  NaplesYellow: [250, 218, 94],
  NavajoWhite: [255, 222, 173],
  NavyBlue: [0, 0, 128],
  NavyBlueCrayola: [25, 116, 210],
  NeonBlue: [70, 102, 255],
  NeonBlue2: [77, 77, 255],
  NeonCarrot: [255, 163, 67],
  NeonGreen: [57, 255, 20],
  NeonFuchsia: [254, 65, 100],
  NewYorkPink: [215, 131, 127],
  Nickel: [114, 116, 114],
  NonPhotoBlue: [164, 221, 237],
  Nyanza: [233, 255, 219],
  OceanBlue: [79, 66, 181],
  OceanGreen: [72, 191, 145],
  Ochre: [204, 119, 34],
  OfficeGreen: [0, 128, 0],
  OldBurgundy: [67, 48, 46],
  OldGold: [207, 181, 59],
  OldLace: [253, 245, 230],
  OldLavender: [121, 104, 120],
  OldMauve: [103, 49, 71],
  OldRose: [192, 128, 129],
  OldSilver: [132, 132, 130],
  Olive: [128, 128, 0],
  OliveDrab3: [107, 142, 35],
  OliveDrab7: [60, 52, 31],
  OliveGreen: [181, 179, 92],
  Olivine: [154, 185, 115],
  Onyx: [53, 56, 57],
  Opal: [168, 195, 188],
  OperaMauve: [183, 132, 167],
  Orange: [255, 127, 0],
  OrangeColorWheel: [255, 127, 0],
  OrangeCrayola: [255, 117, 56],
  OrangePantone: [255, 88, 0],
  OrangeWeb: [255, 165, 0],
  OrangePeel: [255, 159, 0],
  OrangeRed: [255, 104, 31],
  OrangeRedCrayola: [255, 83, 73],
  OrangeSoda: [250, 91, 61],
  OrangeYellow: [245, 189, 31],
  OrangeYellowCrayola: [248, 213, 104],
  Orchid: [218, 112, 214],
  OrchidPink: [242, 189, 205],
  OrchidCrayola: [226, 156, 210],
  OuterSpaceCrayola: [45, 56, 58],
  OutrageousOrange: [255, 110, 74],
  Oxblood: [128, 0, 32],
  OxfordBlue: [0, 33, 71],
  OUCrimsonRed: [132, 22, 23],
  PacificBlue: [28, 169, 201],
  PakistanGreen: [0, 102, 0],
  Palatinate: [114, 36, 108],
  PalatinatePurple: [104, 40, 96],
  PaleAqua: [188, 212, 230],
  PaleCerulean: [155, 196, 226],
  PaleGreen: [152, 251, 152],
  PalePink: [250, 218, 221],
  PalePurplePantone: [250, 230, 250],
  PaleSilver: [201, 192, 187],
  PaleSpringBud: [236, 235, 189],
  PansyPurple: [120, 24, 74],
  PaoloVeroneseGreen: [0, 155, 125],
  PapayaWhip: [255, 239, 213],
  ParadisePink: [230, 62, 98],
  ParisGreen: [80, 200, 120],
  PastelPink: [222, 165, 164],
  Patriarch: [128, 0, 128],
  PaynesGrey: [83, 104, 120],
  Peach: [255, 229, 180],
  PeachCrayola: [255, 203, 164],
  PeachPuff: [255, 218, 185],
  Pear: [209, 226, 49],
  PearlyPurple: [183, 104, 162],
  PennBlue: [1, 31, 91],
  PennRed: [153, 0, 0],
  Periwinkle: [204, 204, 255],
  PeriwinkleCrayola: [195, 205, 230],
  PermanentGeraniumLake: [225, 44, 44],
  PersianBlue: [28, 57, 187],
  PersianGreen: [0, 166, 147],
  PersianIndigo: [50, 18, 122],
  PersianOrange: [217, 144, 88],
  PersianPink: [247, 127, 190],
  PersianPlum: [112, 28, 28],
  PersianRed: [204, 51, 51],
  PersianRose: [254, 40, 162],
  Persimmon: [236, 88, 0],
  PewterBlue: [139, 168, 183],
  Phlox: [223, 0, 255],
  PhthaloBlue: [0, 15, 137],
  PhthaloGreen: [18, 53, 36],
  PicoteeBlue: [46, 39, 135],
  PictorialCarmine: [195, 11, 78],
  PiggyPink: [253, 221, 230],
  PineGreen: [1, 121, 111],
  PineTree: [42, 47, 35],
  Pink: [255, 192, 203],
  PinkPantone: [215, 72, 148],
  PinkFlamingo: [252, 116, 253],
  PinkLace: [255, 221, 244],
  PinkLavender: [216, 178, 209],
  PinkSherbet: [247, 143, 167],
  Pistachio: [147, 197, 114],
  Platinum: [229, 228, 226],
  Plum: [142, 69, 133],
  PlumWeb: [221, 160, 221],
  PlumpPurple: [89, 70, 178],
  PolishedPine: [93, 164, 147],
  PolynesianBlue: [34, 76, 152],
  PompAndPower: [134, 96, 142],
  Popstar: [190, 79, 98],
  PortlandOrange: [255, 90, 54],
  PowderBlue: [176, 224, 230],
  PrincetonOrange: [245, 128, 37],
  Prune: [112, 28, 28],
  PrussianBlue: [0, 49, 83],
  PsychedelicPurple: [223, 0, 255],
  Puce: [204, 136, 153],
  PullmanBrown: [100, 65, 23],
  Pumpkin: [255, 117, 24],
  Purple: [106, 13, 173],
  PurpleWeb: [128, 0, 128],
  PurpleMunsell: [159, 0, 197],
  PurpleX11: [160, 32, 240],
  PurpleMountainMajesty: [150, 120, 182],
  PurpleNavy: [78, 81, 128],
  PurplePizzazz: [254, 78, 218],
  PurplePlum: [156, 81, 182],
  Purpureus: [154, 78, 174],
  QueenBlue: [67, 107, 149],
  QueenPink: [232, 204, 215],
  QuickSilver: [166, 166, 166],
  QuinacridoneMagenta: [142, 58, 89],
  RadicalRed: [255, 53, 94],
  RaisinBlack: [36, 33, 36],
  Rajah: [251, 171, 96],
  Raspberry: [227, 11, 93],
  RaspberryGlace: [145, 95, 109],
  RaspberryRose: [179, 68, 108],
  RawSienna: [214, 138, 89],
  RawUmber: [130, 102, 68],
  RazzleDazzleRose: [255, 51, 204],
  Razzmatazz: [227, 37, 107],
  RazzmicBerry: [141, 78, 133],
  RebeccaPurple: [102, 51, 153],
  Red: [255, 0, 0],
  RedX11: [255, 0, 0],
  RedCrayola: [238, 32, 77],
  RedMunsell: [242, 0, 60],
  RedNCS: [196, 2, 51],
  RedPantone: [237, 41, 57],
  RedPigment: [237, 28, 36],
  RedRYB: [254, 39, 18],
  RedOrange: [255, 83, 73],
  RedOrangeCrayola: [255, 104, 31],
  RedOrangeColorWheel: [255, 69, 0],
  RedPurple: [228, 0, 120],
  RedAlsa: [253, 58, 74],
  RedViolet: [199, 21, 133],
  RedVioletCrayola: [192, 68, 143],
  RedVioletColorWheel: [146, 43, 62],
  Redwood: [164, 90, 82],
  ResedaGreen: [108, 124, 89],
  ResolutionBlue: [0, 35, 135],
  Rhythm: [119, 118, 150],
  RichBlack: [0, 64, 64],
  RichBlackFOGRA29: [1, 11, 19],
  RichBlackFOGRA39: [1, 2, 3],
  RifleGreen: [68, 76, 56],
  RobinEggBlue: [0, 204, 204],
  RocketMetallic: [138, 127, 128],
  RomanSilver: [131, 137, 150],
  Rose: [255, 0, 127],
  RoseBonbon: [249, 66, 158],
  RoseDust: [158, 94, 111],
  RoseEbony: [103, 72, 70],
  RoseMadder: [227, 38, 54],
  RosePink: [255, 102, 204],
  RoseQuartz: [170, 152, 169],
  RoseRed: [194, 30, 86],
  RoseTaupe: [144, 93, 93],
  RoseVale: [171, 78, 82],
  Rosewood: [101, 0, 11],
  RossoCorsa: [212, 0, 0],
  RosyBrown: [188, 143, 143],
  RoyalBlueDark: [0, 35, 102],
  RoyalBlueLight: [65, 105, 225],
  RoyalPurple: [120, 81, 169],
  RoyalYellow: [250, 218, 94],
  Ruber: [206, 70, 118],
  RubineRed: [209, 0, 86],
  Ruby: [224, 17, 95],
  RubyRed: [155, 17, 30],
  RuddyBlue: [118, 171, 223],
  Rufous: [168, 28, 7],
  Russet: [128, 70, 27],
  RussianGreen: [103, 146, 103],
  RussianViolet: [50, 23, 77],
  Rust: [183, 65, 14],
  RustyRed: [218, 44, 67],
  SacramentoStateGreen: [4, 57, 39],
  SacramentoStateGreen2: [0, 78, 56],
  SaddleBrown: [139, 69, 19],
  SafetyOrange: [255, 120, 0],
  SafetyOrangeBlaze: [255, 103, 0],
  SafetyYellow: [238, 210, 2],
  Saffron: [244, 196, 48],
  Sage: [188, 184, 138],
  StPatricksBlue: [35, 41, 122],
  Salmon: [250, 128, 114],
  SalmonPink: [255, 145, 164],
  Sand: [194, 178, 128],
  SandDune: [150, 113, 23],
  SandyBrown: [244, 164, 96],
  SapGreen: [80, 125, 42],
  Sapphire: [15, 82, 186],
  Sapphire2: [8, 37, 103],
  SapphireCrayola: [0, 103, 165],
  SatinSheenGold: [203, 161, 53],
  SavoyBlue: [75, 97, 209],
  Scarlet: [255, 36, 0],
  SchaussPink: [255, 145, 175],
  SchoolBusYellow: [255, 216, 0],
  ScreaminGreen: [102, 255, 102],
  SeaGreen: [46, 139, 87],
  SeaGreenCrayola: [0, 255, 205],
  SealBrown: [89, 38, 11],
  Seashell: [255, 245, 238],
  SelectiveYellow: [255, 186, 0],
  Sepia: [112, 66, 20],
  SGBUSGreen: [85, 221, 51],
  Shadow: [138, 121, 93],
  ShadowBlue: [119, 139, 165],
  ShamrockGreen: [0, 158, 96],
  SheenGreen: [143, 212, 0],
  ShimmeringBlush: [217, 134, 149],
  ShinyShamrock: [95, 167, 120],
  ShockingPink: [252, 15, 192],
  ShockingPinkCrayola: [255, 111, 255],
  Sienna: [136, 45, 23],
  Silver: [192, 192, 192],
  SilverCrayola: [201, 192, 187],
  SilverMetallic: [170, 169, 173],
  SilverChalice: [172, 172, 172],
  SilverPink: [196, 174, 173],
  SilverSand: [191, 193, 194],
  Sinopia: [203, 65, 11],
  SizzlingRed: [255, 56, 85],
  SizzlingSunrise: [255, 219, 0],
  Skobeloff: [0, 116, 116],
  SkyBlue: [135, 206, 235],
  SkyBlueCrayola: [118, 215, 234],
  SkyMagenta: [207, 113, 175],
  SlateBlue: [106, 90, 205],
  SlateGray: [112, 128, 144],
  SlimyGreen: [41, 150, 23],
  Smitten: [200, 65, 134],
  SmokyBlack: [16, 12, 8],
  Snow: [255, 250, 250],
  SolidPink: [137, 56, 67],
  SonicSilver: [117, 117, 117],
  SpaceCadet: [29, 41, 81],
  SpaceCadet2: [30, 41, 82],
  SpanishBistre: [128, 117, 50],
  SpanishBlue: [0, 112, 184],
  SpanishCarmine: [209, 0, 71],
  SpanishGray: [152, 152, 152],
  SpanishGreen: [0, 145, 80],
  SpanishOrange: [232, 97, 0],
  SpanishPink: [247, 191, 190],
  SpanishRed: [230, 0, 38],
  SpanishSkyBlue: [0, 255, 255],
  SpanishViolet: [76, 40, 130],
  SpanishViridian: [0, 127, 92],
  SpringBud: [167, 252, 0],
  SpringFrost: [135, 255, 42],
  SpringGreen: [0, 255, 127],
  SpringGreenCrayola: [236, 235, 189],
  StarCommandBlue: [0, 123, 184],
  SteelBlue: [70, 130, 180],
  SteelPink: [204, 51, 204],
  SteelTeal: [95, 138, 139],
  StilDeGrainYellow: [250, 218, 94],
  Straw: [228, 217, 111],
  SugarPlum: [145, 78, 117],
  Sunglow: [255, 204, 51],
  Sunray: [227, 171, 87],
  Sunset: [250, 214, 165],
  SuperPink: [207, 107, 169],
  SweetBrown: [168, 55, 49],
  SyracuseOrange: [212, 69, 0],
  Tan: [210, 180, 140],
  TanCrayola: [217, 154, 108],
  Tangerine: [242, 133, 0],
  TangoPink: [228, 113, 122],
  TartOrange: [251, 77, 70],
  Taupe: [72, 60, 50],
  TaupeGray: [139, 133, 137],
  Tawny: [205, 87, 0],
  TeaGreen: [208, 240, 192],
  TeaRose: [244, 194, 194],
  TeaRose2: [248, 131, 121],
  Teal: [0, 128, 128],
  TealBlue: [54, 117, 136],
  Telemagenta: [207, 52, 118],
  TerraCotta: [226, 114, 91],
  Thistle: [216, 191, 216],
  ThulianPink: [222, 111, 161],
  TickleMePink: [252, 137, 172],
  TiffanyBlue: [10, 186, 181],
  TigersEye: [181, 105, 23],
  Timberwolf: [219, 215, 210],
  TitaniumYellow: [238, 230, 0],
  Tomato: [255, 99, 71],
  TropicalRainforest: [0, 117, 94],
  TrueBlue: [45, 104, 196],
  TrypanBlue: [28, 5, 179],
  TuftsBlue: [62, 142, 222],
  Tumbleweed: [222, 170, 136],
  TurkeyRed: [169, 17, 1],
  Turquoise: [64, 224, 208],
  TurquoiseBlue: [0, 255, 239],
  TurquoiseGreen: [160, 214, 180],
  TurtleGreen: [138, 154, 91],
  Tuscan: [250, 214, 165],
  TuscanBrown: [111, 78, 55],
  TuscanRed: [124, 72, 72],
  TuscanTan: [166, 123, 91],
  Tuscany: [192, 153, 153],
  TwilightLavender: [138, 73, 107],
  TyrianPurple: [102, 2, 60],
  UABlue: [0, 51, 170],
  UARed: [217, 0, 76],
  Ultramarine: [63, 0, 255],
  UltramarineBlue: [65, 102, 245],
  UltraPink: [255, 111, 255],
  UltraRed: [252, 108, 133],
  Umber: [99, 81, 71],
  UnbleachedSilk: [255, 221, 202],
  UnitedNationsBlue: [91, 146, 229],
  UnmellowYellow: [255, 255, 102],
  UNTGreen: [0, 133, 62],
  UPForestGreen: [1, 68, 33],
  UPMaroon: [123, 17, 19],
  UpsdellRed: [174, 32, 41],
  UranianBlue: [175, 219, 245],
  USAFABlue: [0, 79, 152],
  UTOrange: [255, 130, 0],
  VanDykeBrown: [102, 66, 40],
  Vanilla: [243, 229, 171],
  VanillaIce: [243, 143, 169],
  VegasGold: [197, 179, 88],
  VenetianRed: [200, 8, 21],
  Verdigris: [67, 179, 174],
  Vermilion: [217, 56, 30],
  Vermilion2: [227, 66, 52],
  Veronica: [160, 32, 240],
  Violet: [143, 0, 255],
  VioletColorWheel: [127, 0, 255],
  VioletCrayola: [150, 61, 127],
  VioletRYB: [134, 1, 175],
  VioletWeb: [238, 130, 238],
  VioletBlue: [50, 74, 178],
  VioletBlueCrayola: [118, 110, 200],
  VioletRed: [247, 83, 148],
  Viridian: [64, 130, 109],
  ViridianGreen: [0, 150, 152],
  VividBurgundy: [159, 29, 53],
  VividSkyBlue: [0, 204, 255],
  VividTangerine: [255, 160, 137],
  VividViolet: [159, 0, 255],
  Volt: [206, 255, 0],
  WarmBlack: [0, 66, 66],
  Wheat: [245, 222, 179],
  White: [255, 255, 255],
  WildBlueYonder: [162, 173, 208],
  WildOrchid: [212, 112, 162],
  WildStrawberry: [255, 67, 164],
  WildWatermelon: [252, 108, 133],
  WindsorTan: [167, 85, 2],
  Wine: [114, 47, 55],
  WineDregs: [103, 49, 71],
  WinterSky: [255, 0, 124],
  WintergreenDream: [86, 136, 125],
  Wisteria: [201, 160, 220],
  WoodBrown: [193, 154, 107],
  Xanthic: [238, 237, 9],
  Xanadu: [115, 134, 120],
  YaleBlue: [15, 77, 146],
  Yellow: [255, 255, 0],
  YellowCrayola: [252, 232, 131],
  YellowMunsell: [239, 204, 0],
  YellowNCS: [255, 211, 0],
  YellowPantone: [254, 223, 0],
  YellowProcess: [255, 239, 0],
  YellowRYB: [254, 254, 51],
  YellowGreen: [154, 205, 50],
  YellowGreenCrayola: [197, 227, 132],
  YellowGreenColorWheel: [48, 178, 26],
  YellowOrange: [255, 174, 66],
  YellowOrangeColorWheel: [255, 149, 5],
  YellowPigment: [255, 239, 0],
  YellowSunshine: [255, 247, 0],
  YellowX11: [255, 255, 0],
  YInMnBlue: [46, 80, 144],
  Zaffre: [0, 20, 168],
  Zomp: [57, 167, 142]
};

const clip1 = clipper({
  min: 0,
  max: 1
});
const clip255 = clipper({
  min: 0,
  max: 255
});
const clip360 = clipper({
  min: 0,
  max: 360
});
class Color {
  constructor(data) {
    this._setData(data);
  }

  _setData({
    mode,
    components
  }) {
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

    this.components = components.map((value, index) => clips[index](value));
    this.mode = mode;
    this.name = null;
  }

  static create(arg = {}) {
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

  static fromString(str) {
    if (matchHexString(str)) {
      return this.fromHex(str);
    }

    if (matchCssString(str)) {
      return this.fromCss(str);
    }

    if (this.nameExists(str)) {
      return this.fromName(str);
    }

    throw new Error(`Invalid string format: ${str}`);
  }

  static fromHex(str) {
    const components = hexToRgb(str);
    return this.fromRgb(components);
  }

  static fromCss(str) {
    const obj = cssToColor(str);
    return this.create(obj);
  }

  static fromRgb(arg) {
    let r;
    let g;
    let b;
    let a;

    if (Array.isArray(arg)) {
      checkComponents(arg);
      [r, g, b, a] = arg;
    } else if (isRgb(arg)) {
      ({
        r,
        g,
        b,
        a
      } = charkeys(arg));
    } else {
      throw new Error(`Invalid RGB format: ${arg}`);
    }

    return new this({
      mode: Mode.rgb,
      components: [r, g, b, a]
    });
  }

  static fromHsl(arg) {
    let h;
    let s;
    let l;
    let a;

    if (Array.isArray(arg)) {
      checkComponents(arg);
      [h, s, l, a] = arg;
    } else if (isHsl(arg)) {
      ({
        h,
        s,
        l,
        a
      } = charkeys(arg));
    } else {
      throw new Error(`Invalid HSL format: ${arg}`);
    }

    return new this({
      mode: Mode.hsl,
      components: [h, s, l, a]
    });
  }

  static fromHsv(arg) {
    let h;
    let s;
    let v;
    let a;

    if (Array.isArray(arg)) {
      checkComponents(arg);
      [h, s, v, a] = arg;
    } else if (isHsv(arg)) {
      ({
        h,
        s,
        v,
        a
      } = charkeys(arg));
    } else {
      throw new Error(`Invalid HSV format: ${arg}`);
    }

    return new this({
      mode: Mode.hsv,
      components: [h, s, v, a]
    });
  }

  static fromName(name) {
    if (!this.nameExists(name)) {
      throw new Error(`No color named ${name}`);
    }

    const rgb = NamedColors[name];
    const color = this.fromRgb(rgb);
    color.name = name;
    return color;
  }

  static names() {
    return Object.keys(NamedColors);
  }

  static nameExists(name) {
    return name in NamedColors;
  }

  static random() {
    const components = [];

    for (let i = 0; i < 3; i++) {
      const component = randomInt({
        max: 255
      });
      components.push(component);
    }

    return new this({
      mode: Mode.rgb,
      components
    });
  }

  equals(color) {
    if (color.constructor !== this.constructor) {
      color = this.constructor.create(color);
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

  shade(factor) {
    this.lightness -= factor;
    return this;
  }

  tint(factor) {
    this.lightness += factor;
    return this;
  }

  complement() {
    const {
      mode
    } = this;

    if (mode === Mode.rgb) {
      this.rgb = this.rgb.map(c => 255 - c);
    } else {
      this.hue = (this.hue + 180) % 360;
    }

    return this;
  }

  clone() {
    return new this.constructor({
      mode: this.mode,
      components: [...this.components]
    });
  }

  _getComponents(mode) {
    this._switchMode(mode);

    return [...this.components];
  }

  _getColorComponents(mode) {
    return this._getComponents(mode).slice(0, 3);
  }

  _setComponents({
    mode,
    components,
    alpha
  }) {
    if (alpha) {
      alpha = components[3];
    } else {
      ({
        alpha
      } = this);
    }

    components = [...components.slice(0, 3), alpha];

    this._setData({
      mode,
      components
    });
  }

  _getComponent(name) {
    this._switchModeForComponent(name);

    const index = this._getComponentIndex(name);

    return this.components[index];
  }

  _setComponent({
    name,
    value
  }) {
    this._switchModeForComponent(name);

    const index = this._getComponentIndex(name);

    const clip = this._getComponentClip(name);

    this.components[index] = clip(value);
  }

  _getComponentIndex(name) {
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

  _getComponentClip(name) {
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

  _switchMode(mode) {
    if (!(mode in Mode) || this.mode === mode) {
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

  _switchModeForComponent(name) {
    if (['red', 'green', 'blue'].includes(name)) {
      this._switchMode(Mode.rgb);
    }

    if (['hue', 'saturation'].includes(name) && this.mode === Mode.rgb) {
      this._switchMode(Mode.hsl);
    }

    if (name === 'lightness') {
      this._switchMode(Mode.hsl);
    }

    if (name === 'value') {
      this._switchMode(Mode.hsv);
    }
  }

  get({
    mode = this.mode,
    abbreviated = false
  } = {}) {
    this._switchMode(mode);

    const names = componentNames({
      mode,
      abbreviated
    });
    return names.reduce((obj, name, index) => {
      obj[name] = this.components[index];
      return obj;
    }, {});
  }

  set(obj) {
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

    const names = componentNames({
      mode,
      abbreviated: true
    });
    const components = names.map(name => {
      const k = name[0];
      return obj[k];
    });

    this._setData({
      mode,
      components
    });
  }

  get a() {
    return this._getComponent('alpha');
  }

  get alpha() {
    return this._getComponent('alpha');
  }

  get r() {
    return this._getComponent('red');
  }

  get red() {
    return this._getComponent('red');
  }

  get g() {
    return this._getComponent('green');
  }

  get green() {
    return this._getComponent('green');
  }

  get b() {
    return this._getComponent('blue');
  }

  get blue() {
    return this._getComponent('blue');
  }

  get h() {
    return this._getComponent('hue');
  }

  get hue() {
    return this._getComponent('hue');
  }

  get s() {
    return this._getComponent('saturation');
  }

  get saturation() {
    return this._getComponent('saturation');
  }

  get v() {
    return this._getComponent('value');
  }

  get value() {
    return this._getComponent('value');
  }

  get l() {
    return this._getComponent('lightness');
  }

  get lightness() {
    return this._getComponent('lightness');
  }

  get rgba() {
    return this._getComponents(Mode.rgb);
  }

  get rgb() {
    return this._getColorComponents(Mode.rgb);
  }

  get hsla() {
    return this._getComponents(Mode.hsl);
  }

  get hsl() {
    return this._getColorComponents(Mode.hsl);
  }

  get hsva() {
    return this._getComponents(Mode.hsv);
  }

  get hsv() {
    return this._getColorComponents(Mode.hsv);
  }

  get hex() {
    this._switchMode(Mode.rgb);

    return rgbToHex(this.components);
  }

  get hex6() {
    return this.hex.slice(0, 7);
  }

  set a(value) {
    this._setComponent({
      name: 'alpha',
      value
    });
  }

  set alpha(value) {
    this._setComponent({
      name: 'alpha',
      value
    });
  }

  set r(value) {
    this._setComponent({
      name: 'red',
      value
    });
  }

  set red(value) {
    this._setComponent({
      name: 'red',
      value
    });
  }

  set g(value) {
    this._setComponent({
      name: 'green',
      value
    });
  }

  set green(value) {
    this._setComponent({
      name: 'green',
      value
    });
  }

  set b(value) {
    this._setComponent({
      name: 'blue',
      value
    });
  }

  set blue(value) {
    this._setComponent({
      name: 'blue',
      value
    });
  }

  set h(value) {
    this._setComponent({
      name: 'hue',
      value
    });
  }

  set hue(value) {
    this._setComponent({
      name: 'hue',
      value
    });
  }

  set s(value) {
    this._setComponent({
      name: 'saturation',
      value
    });
  }

  set saturation(value) {
    this._setComponent({
      name: 'saturation',
      value
    });
  }

  set v(value) {
    this._setComponent({
      name: 'value',
      value
    });
  }

  set value(value) {
    this._setComponent({
      name: 'value',
      value
    });
  }

  set l(value) {
    this._setComponent({
      name: 'lightness',
      value
    });
  }

  set lightness(value) {
    this._setComponent({
      name: 'lightness',
      value
    });
  }

  set rgb(components) {
    this._setComponents({
      mode: Mode.rgb,
      components,
      alpha: false
    });
  }

  set rgba(components) {
    this._setComponents({
      mode: Mode.rgb,
      components,
      alpha: true
    });
  }

  set hsl(components) {
    this._setComponents({
      mode: Mode.hsl,
      components,
      alpha: false
    });
  }

  set hsla(components) {
    this._setData({
      mode: Mode.hsl,
      components,
      alpha: true
    });
  }

  set hsv(components) {
    this._setComponents({
      mode: Mode.hsv,
      components,
      alpha: false
    });
  }

  set hsva(components) {
    this._setData({
      mode: Mode.hsv,
      components,
      alpha: true
    });
  }

  set hex(hex) {
    const components = hexToRgb(hex);

    this._setData({
      mode: Mode.rgb,
      components
    });
  }

  css({
    format = 'rgba',
    alpha = this.alpha
  } = {}) {
    if (!['hex', 'hsl', 'hsla', 'rgb', 'rgba'].includes(format)) {
      throw new Error(`Unsupported css format: ${format}`);
    }

    if (format === 'hex') {
      const components = [...this.rgb, alpha];
      return rgbToHex(components);
    } else {
      const mode = format.slice(0, 3);
      const obj = this.get({
        mode,
        abbreviated: true
      });

      if (format.includes('a')) {
        obj.a = alpha;
      } else {
        delete obj.a;
      }

      return colorToCss(obj);
    }
  }

  toString() {
    return this.hex;
  }

}

Color.converters = converters;

export default Color;
//# sourceMappingURL=index.esm.js.map
