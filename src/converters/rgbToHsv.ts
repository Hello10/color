import type { Components } from "../checkComponents";
import { Mode } from "../Mode";
import rgbToHslOrHsv from "./rgbToHslOrHsv";

export default function rgbToHsv(components: number[]): Components {
	return rgbToHslOrHsv({ components, mode: Mode.hsv });
}
