import { fileExists, readText, writeText } from "./fs-store.js";

type Merge = (existing: string, section: string) => string | null;

/** Writes `section` as the whole file, or merges it into one that exists. True when the file changed. */
export const writeAgentFile = (
	path: string,
	section: string,
	merge: Merge,
): boolean => {
	if (!fileExists(path)) {
		writeText(path, section);
		return true;
	}
	const merged = merge(readText(path), section);
	if (merged === null) {
		return false;
	}
	writeText(path, merged);
	return true;
};
