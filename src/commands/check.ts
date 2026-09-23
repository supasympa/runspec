import { readTextFiles } from "../adapters/fs-store.js";
import { sha256 } from "../adapters/hash.js";
import { runChecks } from "../domain/check.js";
import { findMarkers } from "../domain/traceability.js";
import { loadConfig } from "./config.js";
import { loadDecisions, loadScenarios, readSeals } from "./store.js";

export const runCheck = (cwd: string): number => {
	const config = loadConfig(cwd);
	if (!config.ok) {
		console.log(config.error);
		return 1;
	}
	const scenarios = loadScenarios(cwd);
	const decisions = loadDecisions(cwd);
	const parseErrors = [...scenarios.errors, ...decisions.errors];
	if (parseErrors.length > 0) {
		for (const error of parseErrors) {
			console.log(`FAIL [parse] ${error}`);
		}
		return 1;
	}
	const seals = readSeals(cwd);
	if (!seals.ok) {
		console.log(`FAIL [seals] ${seals.error}`);
		return 1;
	}
	const markers = findMarkers(
		readTextFiles(
			[...config.value.testGlobs, ...config.value.generatedGlobs],
			cwd,
		),
	);
	const generatedFiles = readTextFiles(config.value.generatedGlobs, cwd);
	const currentHashes: Record<string, string> = {};
	for (const file of generatedFiles) {
		currentHashes[file.path] = sha256(file.content);
	}
	const failures = runChecks({
		scenarios: scenarios.items,
		decisions: decisions.items,
		markers,
		sealedHashes: seals.value,
		currentHashes,
	});
	if (failures.length === 0) {
		const approved = scenarios.items.filter(
			(s) => s.status === "approved",
		).length;
		console.log(
			`runspec: all clear. ${approved} approved scenario(s), ${markers.length} marker(s), ${generatedFiles.length} sealed file(s).`,
		);
		return 0;
	}
	for (const failure of failures) {
		console.log(`FAIL [${failure.code}] ${failure.message}`);
	}
	console.log(`${failures.length} failure(s).`);
	return 1;
};
