import { readTextFiles } from "../adapters/fs-store.js";
import { findMarkers } from "../domain/traceability.js";
import { loadConfig } from "./config.js";
import { loadDecisions, loadScenarios, readSeals } from "./store.js";

export const runStatus = (cwd: string): number => {
	const config = loadConfig(cwd);
	if (!config.ok) {
		console.log(config.error);
		return 1;
	}
	const scenarios = loadScenarios(cwd);
	const decisions = loadDecisions(cwd);
	const markers = findMarkers(readTextFiles(config.value.testGlobs, cwd));
	const seals = readSeals(cwd);
	const approved = scenarios.items.filter(
		(s) => s.status === "approved",
	).length;
	const draft = scenarios.items.filter((s) => s.status === "draft").length;
	console.log(
		`scenarios: ${scenarios.items.length} (${approved} approved, ${draft} draft)`,
	);
	for (const error of scenarios.errors) {
		console.log(`  ! ${error}`);
	}
	console.log(`decisions: ${decisions.items.length}`);
	console.log(`test markers: ${markers.length}`);
	console.log(
		`sealed files: ${seals.ok ? Object.keys(seals.value).length : "unreadable"}`,
	);
	return 0;
};
