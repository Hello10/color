import {hasAllCharkeys} from '@hello10/util';

export function matchCssString (str) {
  return str.match(/^(rgb|hsl)a?\(/i);
}

export function matchHexString (str) {
  return str.match(/^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
}

export const isRgb = hasAllCharkeys(['r', 'g', 'b']);
export const isHsl = hasAllCharkeys(['h', 's', 'l']);
export const isHsv = hasAllCharkeys(['h', 's', 'v']);
