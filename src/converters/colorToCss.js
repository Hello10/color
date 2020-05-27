import {charkeys, rounder, defined} from '@hello10/util';

import {componentNames} from '../Mode';
import {isRgb, isHsl} from '../matchers';

const round2 = rounder({decimals: 2});

export default function colorToCss (obj) {
  obj = charkeys(obj);

  let fn;
  if (isRgb(obj)) {
    fn = 'rgb';
  } else if (isHsl(obj)) {
    fn = 'hsl';
  } else {
    throw new Error('Unsupported format');
  }

  const names = componentNames({mode: fn, abbreviated: true});
  let components = names.map((name)=> obj[name]);

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
