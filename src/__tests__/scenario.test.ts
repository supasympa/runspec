import { describe, expect, test } from "bun:test";
import {
	approveScenario,
	formatScenario,
	nextScenarioId,
	parseScenario,
	scenarioWarnings,
} from "../domain/scenario.js";

const example = `# S-03: sickness cancellation

Status: approved
Approved by: S. Okafor, 22 Sep 2026

Given a patient cancels because of sickness
Then 1. the appointment is cancelled
 2. no charge is made`;

describe("parseScenario", () => {
	test("parses an approved scenario", () => {
		const parsed = parseScenario(example);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) {
			return;
		}
		expect(parsed.value.id).toBe("S-03");
		expect(parsed.value.title).toBe("sickness cancellation");
		expect(parsed.value.status).toBe("approved");
		expect(parsed.value.approvedBy).toBe("S. Okafor, 22 Sep 2026");
		expect(parsed.value.body).toContain("Given a patient cancels");
	});

	test("round trips through format", () => {
		const parsed = parseScenario(example);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) {
			return;
		}
		const reparsed = parseScenario(formatScenario(parsed.value));
		expect(reparsed).toEqual(parsed);
	});

	test("reads and writes the hash taken at approval", () => {
		const parsed = parseScenario(
			`${example}\n`.replace(
				"Approved by: S. Okafor, 22 Sep 2026",
				"Approved by: S. Okafor\nApproved hash: 9f86d081",
			),
		);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) {
			return;
		}
		expect(parsed.value.approvedHash).toBe("9f86d081");
		expect(parsed.value.body).not.toContain("Approved hash");
		expect(formatScenario(parsed.value)).toContain("Approved hash: 9f86d081");
	});

	test("rejects a missing heading", () => {
		expect(parseScenario("Status: draft").ok).toBe(false);
	});
});

describe("approveScenario", () => {
	test("sets status and approver without mutating", () => {
		const parsed = parseScenario(example);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) {
			return;
		}
		const approved = approveScenario(parsed.value, "L. Barclay", "abc123");
		expect(approved.status).toBe("approved");
		expect(approved.approvedBy).toBe("L. Barclay");
		expect(approved.approvedHash).toBe("abc123");
		expect(parsed.value.approvedBy).toBe("S. Okafor, 22 Sep 2026");
	});
});

describe("scenarioWarnings", () => {
	test("a scenario with many Then steps warns about scope", () => {
		const parsed = parseScenario(
			"# S-01: big\n\nStatus: draft\n\nGiven a thing\nThen 1. a\n 2. b\n 3. c\n 4. d\n 5. e\n 6. f",
		);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) {
			return;
		}
		expect(scenarioWarnings(parsed.value).length).toBe(1);
	});

	test("a single-behaviour scenario stays quiet", () => {
		const parsed = parseScenario(example);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) {
			return;
		}
		expect(scenarioWarnings(parsed.value)).toEqual([]);
	});
});

describe("nextScenarioId", () => {
	test("starts at S-01", () => {
		expect(nextScenarioId([])).toBe("S-01");
	});

	test("continues past the highest", () => {
		expect(nextScenarioId(["S-01", "S-03"])).toBe("S-04");
	});
});
