import { join } from "node:path";
import { readTextFiles, writeText } from "../adapters/fs-store.js";
import { sha256 } from "../adapters/hash.js";
import { loadConfig } from "./config.js";

export const runSeal = (cwd: string): number => {
	const config = loadConfig(cwd);
	if (!config.ok) {
		console.log(config.error);
		return 1;
	}
	const files = readTextFiles(config.value.generatedGlobs, cwd);
	const hashes: Record<string, string> = {};
	for (const file of files) {
		hashes[file.path] = sha256(file.content);
	}
	writeText(
		join(cwd, ".runspec", "seals.json"),
		`${JSON.stringify(hashes, null, 2)}\n`,
	);
	console.log(`Sealed ${files.length} generated file(s).`);
	return 0;
};
