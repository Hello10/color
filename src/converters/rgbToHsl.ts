import type { Components } from "../checkComponents";
import { Mode } from "../Mode";
import rgbToHslOrHsv from "./rgbToHslOrHsv";

export default function rgbToHsl(components: number[]): Components {
	return rgbToHslOrHsv({ components, mode: Mode.hsl });
}
