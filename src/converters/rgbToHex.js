import checkComponents from '../checkComponents';

export default function rgbToHex (components) {
  checkComponents(components);

  const values = components.slice(0, 3);
  if (components.length === 4) {
    values.push(components[3] * 255);
  }

  const hex_values = values.map((value)=> {
    let hex = Math.round(value).toString(16).toLowerCase();
    if (hex.length === 1) {
      hex = `0${hex}`;
    }
    return hex;
  });

  return `#${hex_values.join('')}`;
}
