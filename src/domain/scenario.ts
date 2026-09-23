import { err, ok, type Result } from "./result.js";

export type ScenarioStatus = "draft" | "approved" | "superseded";

export type Scenario = {
	id: string;
	title: string;
	status: ScenarioStatus;
	approvedBy: string | null;
	approvedHash: string | null;
	body: string;
};

type Header = Pick<Scenario, "status" | "approvedBy" | "approvedHash">;

const headingPattern = /^#\s+(S-\d+):\s*(.+)$/;

const headerFields: [RegExp, (value: string) => Partial<Header>][] = [
	[
		/^Status:\s*(draft|approved|superseded)\s*$/,
		(value) => ({ status: value as ScenarioStatus }),
	],
	[/^Approved by:\s*(.+)$/, (value) => ({ approvedBy: value })],
	[/^Approved hash:\s*([0-9a-f]+)\s*$/, (value) => ({ approvedHash: value })],
];

const readHeaderLine = (line: string): Partial<Header> | null => {
	for (const [pattern, read] of headerFields) {
		const match = line.match(pattern);
		if (match) {
			return read(match[1]);
		}
	}
	return null;
};

export const parseScenario = (content: string): Result<Scenario, string> => {
	const lines = content.split("\n");
	const heading = lines[0]?.match(headingPattern);
	if (!heading) {
		return err("first line must be '# S-NN: title'");
	}
	let header: Header = {
		status: "draft",
		approvedBy: null,
		approvedHash: null,
	};
	const body: string[] = [];
	for (const line of lines.slice(1)) {
		const field = readHeaderLine(line);
		if (field) {
			header = { ...header, ...field };
		} else {
			body.push(line);
		}
	}
	return ok({
		id: heading[1],
		title: heading[2].trim(),
		...header,
		body: body.join("\n").trim(),
	});
};

export const formatScenario = (scenario: Scenario): string => {
	const approval = [
		scenario.approvedBy ? `\nApproved by: ${scenario.approvedBy}` : "",
		scenario.approvedHash ? `\nApproved hash: ${scenario.approvedHash}` : "",
	].join("");
	return `# ${scenario.id}: ${scenario.title}\n\nStatus: ${scenario.status}${approval}\n\n${scenario.body}\n`;
};

/** `bodyHash` is the hash of `scenario.body`; `runspec check` compares against it. */
export const approveScenario = (
	scenario: Scenario,
	by: string,
	bodyHash: string,
): Scenario => ({
	...scenario,
	status: "approved",
	approvedBy: by,
	approvedHash: bodyHash,
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
