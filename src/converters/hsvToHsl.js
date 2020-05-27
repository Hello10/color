import checkComponents from '../checkComponents';

export default function hsvToHsl (components) {
  checkComponents(components);

  const [hue, saturation_v, value, alpha] = components;

  const lightness = value * (1 - (saturation_v / 2));

  let saturation_l;
  if ((lightness === 0) || (lightness === 1)) {
    saturation_l = 0;
  } else {
    const min_lightness = Math.min(lightness, 1 - lightness);
    saturation_l = (value - lightness) / min_lightness;
  }

  const new_components = [hue, saturation_l, lightness];

  if (alpha) {
    new_components.push(alpha);
  }

  return new_components;
}
