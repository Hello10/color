import checkComponents from '../checkComponents';

// Based off of https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB
export default function hslToRgb (components) {
  checkComponents(components);

  const [saturation, lightness, alpha] = components.slice(1);

  // this is for the indexing below, without it, things get fucked up
  // on inputs like [0, 0.23, 0.45]
  let hue = components[0];
  if (hue === 0) {
    hue = 360;
  }

  const chroma = (1 - Math.abs((2 * lightness) - 1)) * saturation;
  const offset = lightness - (chroma / 2);
  const sector = hue / 60.0;
  const x = chroma * (1 - Math.abs((sector % 2) - 1));

  const sextant = Math.ceil(sector) - 1;
  let new_components = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x]
  ][sextant] || [0, 0, 0];

  new_components = new_components.map((c)=> (c + offset) * 255);

  if (alpha) {
    new_components.push(alpha);
  }

  return new_components;
}

// Based off https://stackoverflow.com/a/9493060/178043
export function hslToRgb2 (components) {
  checkComponents(components);

  const [saturation, lightness, alpha] = components.slice(1);
  const hue = components[0] / 360;

  let new_components;
  if (saturation === 0) {
    new_components = [lightness, lightness, lightness];
  } else {
    let q;
    if (lightness < 0.5) {
      q = lightness * (1 + saturation);
    } else {
      q = lightness + saturation - (lightness * saturation);
    }
    const p = (2 * lightness) - q;

    new_components = [
      hue + 1 / 3,
      hue,
      hue - 1 / 3
    ].map((h)=> {
      if (h < 0) {
        h += 1;
      }
      if (h > 1) {
        h -= 1;
      }

      if (h < 1 / 6) {
        return p + (q - p) * 6 * h;
      } else if (h < 1 / 2) {
        return q;
      } else if (h < 2 / 3) {
        return p + (q - p) * (2 / 3 - h) * 6;
      } else {
        return p;
      }
    });
  }

  new_components = new_components.map((c)=> c * 255);

  if (alpha) {
    new_components.push(alpha);
  }

  return new_components;
}
