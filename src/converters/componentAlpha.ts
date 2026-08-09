import type { Components } from "../checkComponents";

export function componentAlpha(components: Components): number | undefined {
	return components.length === 4 ? components[3] : undefined;
}
