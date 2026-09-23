import { readTextFiles } from "../adapters/fs-store.js";
import { sha256 } from "../adapters/hash.js";
import { type CheckInput, runChecks } from "../domain/check.js";
import { err, ok, type Result } from "../domain/result.js";
import { scenarioWarnings } from "../domain/scenario.js";
import { findMarkers } from "../domain/traceability.js";
import { loadConfig, type RunspecConfig } from "./config.js";
import { loadDecisions, loadScenarios, readSeals } from "./store.js";

const hashGenerated = (
	cwd: string,
	config: RunspecConfig,
): Record<string, string> =>
	Object.fromEntries(
		readTextFiles(config.generatedGlobs, cwd).map((file) => [
			file.path,
			sha256(file.content),
		]),
	);

const gatherInput = (
	cwd: string,
	config: RunspecConfig,
): Result<CheckInput, string[]> => {
	const scenarios = loadScenarios(cwd, config);
	const decisions = loadDecisions(cwd, config);
	const parseErrors = [...scenarios.errors, ...decisions.errors];
	if (parseErrors.length > 0) {
		return err(parseErrors.map((error) => `FAIL [parse] ${error}`));
	}
	const seals = readSeals(cwd);
	if (!seals.ok) {
		return err([`FAIL [seals] ${seals.error}`]);
	}
	const scanned = [...config.testGlobs, ...config.generatedGlobs];
	return ok({
		scenarios: scenarios.items,
		decisions: decisions.items,
		markers: findMarkers(readTextFiles(scanned, cwd)),
		sealedHashes: seals.value,
		currentHashes: hashGenerated(cwd, config),
		sources: [...scenarios.sources, ...decisions.sources],
		hash: sha256,
	});
};

const summary = (input: CheckInput): string => {
	const approved = input.scenarios.filter(
		(s) => s.status === "approved",
	).length;
	const sealed = Object.keys(input.sealedHashes).length;
	return `runspec: all clear. ${approved} approved scenario(s), ${input.markers.length} marker(s), ${sealed} sealed file(s).`;
};

const report = (input: CheckInput): number => {
	for (const warning of input.scenarios.flatMap(scenarioWarnings)) {
		console.log(`WARN ${warning}`);
	}
	const failures = runChecks(input);
	if (failures.length === 0) {
		console.log(summary(input));
		return 0;
	}
	for (const failure of failures) {
		console.log(`FAIL [${failure.code}] ${failure.message}`);
	}
	console.log(`${failures.length} failure(s).`);
	return 1;
};

export const runCheck = (cwd: string): number => {
	const config = loadConfig(cwd);
	if (!config.ok) {
		console.log(config.error);
		return 1;
	}
	const input = gatherInput(cwd, config.value);
	if (!input.ok) {
		for (const line of input.error) {
			console.log(line);
		}
		return 1;
	}
	return report(input.value);
};
