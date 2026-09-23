import type { Decision } from "./decision.js";
import type { Scenario } from "./scenario.js";
import type { Marker } from "./traceability.js";

export type CheckFailure = { code: string; message: string };

export type CheckInput = {
	scenarios: Scenario[];
	decisions: Decision[];
	markers: Marker[];
	sealedHashes: Record<string, string>;
	currentHashes: Record<string, string>;
};

export const runChecks = (input: CheckInput): CheckFailure[] => {
	const failures: CheckFailure[] = [];
	const scenarioById = new Map(input.scenarios.map((s) => [s.id, s]));
	const decisionIds = new Set(input.decisions.map((d) => d.id));
	const testedScenarios = new Set(
		input.markers.filter((m) => m.kind === "scenario").map((m) => m.id),
	);

	for (const marker of input.markers) {
		if (marker.kind === "scenario") {
			const scenario = scenarioById.get(marker.id);
			if (!scenario) {
				failures.push({
					code: "unknown-scenario",
					message: `${marker.file} references ${marker.id}, which does not exist`,
				});
			} else if (scenario.status !== "approved") {
				failures.push({
					code: "unapproved-scenario",
					message: `${marker.file} tests ${marker.id}, which is ${scenario.status}. Approve the scenario before its test counts.`,
				});
			}
		} else if (!decisionIds.has(marker.id)) {
			failures.push({
				code: "unknown-decision",
				message: `${marker.file} references ${marker.id}, which does not exist`,
			});
		}
	}

	for (const scenario of input.scenarios) {
		if (scenario.status === "approved" && !testedScenarios.has(scenario.id)) {
			failures.push({
				code: "missing-test",
				message: `${scenario.id} is approved but no test carries a 'runspec: ${scenario.id}' marker`,
			});
		}
	}

	for (const [path, sealed] of Object.entries(input.sealedHashes)) {
		const current = input.currentHashes[path];
		if (current === undefined) {
			failures.push({
				code: "generated-file-missing",
				message: `${path} is sealed but missing. Regenerate it from the model, then 'runspec seal'.`,
			});
		} else if (current !== sealed) {
			failures.push({
				code: "hand-edit",
				message: `${path} differs from its sealed hash. Generated files are outputs: change the model, regenerate, then 'runspec seal'.`,
			});
		}
	}

	return failures;
};
