import rgbToHslOrHsv from './rgbToHslOrHsv';

export default function rgbToHsl (components) {
  return rgbToHslOrHsv({components, mode: 'hsl'});
}
