import {matchCssString} from '../matchers';

export default function cssToColor (str) {
  if (!matchCssString(str)) {
    throw new Error('Invalid css string');
  }

  const components = str.replace(/[^\d,.]/g, '').split(',');

  const is_hsl = str.includes('hsl');
  const names = is_hsl ? ['hue', 'saturation', 'lightness'] : ['red', 'green', 'blue'];
  const color = names.reduce((color, name, index)=> {
    let value = parseFloat(components[index]);
    if (['saturation', 'lightness'].includes(name)) {
      value /= 100;
    }
    color[name] = value;
    return color;
  }, {});

  const has_alpha = str.includes('a');
  if (has_alpha) {
    //eslint-disable-next-line prefer-destructuring
    color.alpha = parseFloat(components[3]);
  }

  return color;
}
