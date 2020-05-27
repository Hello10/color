import rgbToHslOrHsv from './rgbToHslOrHsv';

export default function rgbToHsv (components) {
  return rgbToHslOrHsv({components, mode: 'hsv'});
}
