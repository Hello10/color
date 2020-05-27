import checkComponents from '../checkComponents';

// https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB
export default function rgbToHslOrHsv ({components, mode}) {
  checkComponents(components);

  const [red, green, blue] = components.slice(0, 3).map((c)=> c / 255.0);
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
    hue = ((blue - red) / chroma) + 2;
  } else if (max === blue) {
    hue = ((red - green) / chroma) + 4;
  }
  if (hue < 0) {
    hue += 6.0;
  }
  hue *= 60.0;

  let new_components;
  if (mode === 'hsl') {
    let saturation;
    if ((lightness === 0) || (lightness === 1)) {
      saturation = 0;
    } else {
      saturation = chroma / (1 - Math.abs((2 * lightness) - 1));
    }
    new_components = [hue, saturation, lightness];
  } else {
    const saturation = (value === 0) ? 0 : (chroma / value);
    new_components = [hue, saturation, value];
  }

  if (alpha) {
    new_components.push(alpha);
  }

  return new_components;
}
