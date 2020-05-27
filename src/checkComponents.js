export default function checkComponents (components) {
  const {length} = components;
  if (length < 3 || length > 4) {
    throw new Error('Components must have 3 or 4 elements');
  }
}
