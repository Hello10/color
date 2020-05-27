import checkComponents from '../checkComponents';

export default function hslToHsv (components) {
  checkComponents(components);

  const [hue, saturation_l, lightness, alpha] = components;

  const min_lightness = Math.min(lightness, 1 - lightness);
  const value = lightness + (saturation_l * min_lightness);

  let saturation_v;
  if (value === 0) {
    saturation_v = 0;
  } else {
    saturation_v = 2 * (1 - (lightness / value));
  }

  const new_components = [hue, saturation_v, value];

  if (alpha) {
    new_components.push(alpha);
  }

  return new_components;
}
