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
	hash: (text: string) => string;
};

const scenarioMarkerFailure = (
	marker: Marker,
	scenario: Scenario | undefined,
): CheckFailure | null => {
	if (!scenario) {
		return {
			code: "unknown-scenario",
			message: `${marker.file} references ${marker.id}, which does not exist`,
		};
	}
	if (scenario.status !== "approved") {
		return {
			code: "unapproved-scenario",
			message: `${marker.file} tests ${marker.id}, which is ${scenario.status}. Approve the scenario before its test counts.`,
		};
	}
	return null;
};

const markerFailures = (input: CheckInput): CheckFailure[] => {
	const scenarioById = new Map(input.scenarios.map((s) => [s.id, s]));
	const decisionIds = new Set(input.decisions.map((d) => d.id));
	return input.markers.flatMap((marker) => {
		if (marker.kind === "scenario") {
			return scenarioMarkerFailure(marker, scenarioById.get(marker.id)) ?? [];
		}
		return decisionIds.has(marker.id)
			? []
			: [
					{
						code: "unknown-decision",
						message: `${marker.file} references ${marker.id}, which does not exist`,
					},
				];
	});
};

const coverageFailures = (input: CheckInput): CheckFailure[] => {
	const tested = new Set(
		input.markers.filter((m) => m.kind === "scenario").map((m) => m.id),
	);
	return input.scenarios
		.filter((s) => s.status === "approved" && !tested.has(s.id))
		.map((s) => ({
			code: "missing-test",
			message: `${s.id} is approved but no test carries a 'runspec: ${s.id}' marker`,
		}));
};

const approvalFailure = (
	scenario: Scenario,
	hash: CheckInput["hash"],
): CheckFailure | null => {
	const reapprove = `If the change is agreed, 'runspec scenario approve ${scenario.id} --by <who>' again.`;
	if (scenario.approvedHash === null) {
		return {
			code: "approval-without-hash",
			message: `${scenario.id} is marked approved but carries no approval hash, so an edit since approval cannot be ruled out. ${reapprove}`,
		};
	}
	if (scenario.approvedHash !== hash(scenario.body)) {
		return {
			code: "edited-after-approval",
			message: `${scenario.id} has changed since ${scenario.approvedBy ?? "its approver"} approved it. ${reapprove}`,
		};
	}
	return null;
};

const approvalFailures = (input: CheckInput): CheckFailure[] =>
	input.scenarios
		.filter((s) => s.status === "approved")
		.flatMap((s) => approvalFailure(s, input.hash) ?? []);

const sealFailures = (input: CheckInput): CheckFailure[] =>
	Object.entries(input.sealedHashes).flatMap(([path, sealed]) => {
		const current = input.currentHashes[path];
		if (current === undefined) {
			return {
				code: "generated-file-missing",
				message: `${path} is sealed but missing. Regenerate it from the model, then 'runspec seal'.`,
			};
		}
		if (current !== sealed) {
			return {
				code: "hand-edit",
				message: `${path} differs from its sealed hash. Generated files are outputs: change the model, regenerate, then 'runspec seal'.`,
			};
		}
		return [];
	});

export const runChecks = (input: CheckInput): CheckFailure[] => [
	...markerFailures(input),
	...coverageFailures(input),
	...approvalFailures(input),
	...sealFailures(input),
];
