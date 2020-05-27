import checkComponents from '../checkComponents';

export default function hsvToRgb (components) {
  checkComponents(components);

  const [hue, saturation, value, alpha] = components;

  const hue_sector = hue / 60.0;
  const sextant = Math.floor(hue_sector);
  const offset = hue_sector - sextant;

  const p = value * (1 - saturation) * 255;
  const q = value * (1 - (saturation * offset)) * 255;
  const t = value * (1 - (saturation * (1 - offset))) * 255;
  const v = value * 255;

  const new_components = [
    [v, t, p],
    [q, v, p],
    [p, v, t],
    [p, q, v],
    [t, p, v],
    [v, p, q]
  ][sextant % 6];

  if (alpha) {
    new_components.push(alpha);
  }

  return new_components;
}
