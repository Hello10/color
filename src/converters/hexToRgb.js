import {matchHexString} from '../matchers';

export default function hexToRgb (str) {
  str = str.toLowerCase();

  if (!matchHexString(str)) {
    throw new Error('Invalid hex string');
  }

  const hex = (str[0] === '#') ? str.slice(1) : str;
  const {length} = hex;

  let components;
  if (length === 3) {
    components = [0, 1, 2].map((i)=> parseInt(hex.charAt(i), 16) * 0x11);
  } else if ((length === 6) || (length === 8)) {
    const offsets = [0, 2, 4];
    if (length === 8) {
      offsets.push(6);
    }
    components = offsets.map((i)=> parseInt(hex.substr(i, 2), 16));
  }

  if (components.length === 4) {
    components[3] /= 255;
  }
  return components;
}
