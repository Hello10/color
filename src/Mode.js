export const Mode = {
  rgb: 'rgb',
  hsv: 'hsv',
  hsl: 'hsl'
};

export function componentNames ({mode, abbreviated}) {
  let names = {
    [Mode.rgb]: ['red', 'green', 'blue', 'alpha'],
    [Mode.hsl]: ['hue', 'saturation', 'lightness', 'alpha'],
    [Mode.hsv]: ['hue', 'saturation', 'value', 'alpha']
  }[mode];
  if (abbreviated) {
    names = names.map((name)=> name[0]);
  }
  return names;
}
