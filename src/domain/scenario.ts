import { err, ok, type Result } from "./result.js";

export type ScenarioStatus = "draft" | "approved" | "superseded";

export type Scenario = {
	id: string;
	title: string;
	status: ScenarioStatus;
	approvedBy: string | null;
	body: string;
};

const headingPattern = /^#\s+(S-\d+):\s*(.+)$/;
const statusPattern = /^Status:\s*(draft|approved|superseded)\s*$/;
const approvedByPattern = /^Approved by:\s*(.+)$/;

export const parseScenario = (content: string): Result<Scenario, string> => {
	const lines = content.split("\n");
	const heading = lines[0]?.match(headingPattern);
	if (!heading) {
		return err("first line must be '# S-NN: title'");
	}
	let status: ScenarioStatus = "draft";
	let approvedBy: string | null = null;
	const body: string[] = [];
	for (const line of lines.slice(1)) {
		const statusMatch = line.match(statusPattern);
		if (statusMatch) {
			status = statusMatch[1] as ScenarioStatus;
			continue;
		}
		const approvedMatch = line.match(approvedByPattern);
		if (approvedMatch) {
			approvedBy = approvedMatch[1];
			continue;
		}
		body.push(line);
	}
	return ok({
		id: heading[1],
		title: heading[2].trim(),
		status,
		approvedBy,
		body: body.join("\n").trim(),
	});
};

export const formatScenario = (scenario: Scenario): string => {
	const approval = scenario.approvedBy
		? `\nApproved by: ${scenario.approvedBy}`
		: "";
	return `# ${scenario.id}: ${scenario.title}\n\nStatus: ${scenario.status}${approval}\n\n${scenario.body}\n`;
};

export const approveScenario = (scenario: Scenario, by: string): Scenario => ({
	...scenario,
	status: "approved",
	approvedBy: by,
});

export const nextScenarioId = (existing: string[]): string => {
	const highest = existing.reduce((max, id) => {
		const n = Number(id.slice(2));
		return Number.isFinite(n) ? Math.max(max, n) : max;
	}, 0);
	return `S-${String(highest + 1).padStart(2, "0")}`;
};

const thenStepPattern = /^\s*(?:then\s+)?\d+\./gim;

const thenStepCount = (body: string): number =>
	[...body.matchAll(thenStepPattern)].length;

export const scenarioWarnings = (scenario: Scenario): string[] => {
	const steps = thenStepCount(scenario.body);
	if (steps > 5) {
		return [
			`${scenario.id} covers ${steps} Then steps. One scenario is one behaviour: consider splitting it.`,
		];
	}
	return [];
};
