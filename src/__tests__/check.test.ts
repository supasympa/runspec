import { describe, expect, test } from "bun:test";
import { runChecks } from "../domain/check.js";
import type { Decision } from "../domain/decision.js";
import type { Scenario } from "../domain/scenario.js";
import type { Marker } from "../domain/traceability.js";

const scenario = (id: string, status: Scenario["status"]): Scenario => ({
	id,
	title: `scenario ${id}`,
	status,
	approvedBy: status === "approved" ? "someone" : null,
	body: "Given\nThen 1.",
});

const decision = (id: string): Decision => ({
	id,
	title: `decision ${id}`,
	decidedBy: "someone",
	because: "reason",
	supersedes: null,
});

const marker = (file: string, id: string): Marker => ({
	file,
	kind: id.startsWith("S-") ? "scenario" : "decision",
	id,
});

describe("runChecks", () => {
	test("passes when everything traces", () => {
		const failures = runChecks({
			scenarios: [scenario("S-01", "approved")],
			decisions: [decision("D-001")],
			markers: [
				marker("tests/a.test.ts", "S-01"),
				marker("tests/b.test.ts", "D-001"),
			],
			sealedHashes: {},
			currentHashes: {},
		});
		expect(failures).toEqual([]);
	});

	test("fails on an approved scenario with no test", () => {
		const failures = runChecks({
			scenarios: [scenario("S-01", "approved")],
			decisions: [],
			markers: [],
			sealedHashes: {},
			currentHashes: {},
		});
		expect(failures.map((f) => f.code)).toEqual(["missing-test"]);
	});

	test("fails on a test for an unapproved scenario", () => {
		const failures = runChecks({
			scenarios: [scenario("S-01", "draft")],
			decisions: [],
			markers: [marker("tests/a.test.ts", "S-01")],
			sealedHashes: {},
			currentHashes: {},
		});
		expect(failures.map((f) => f.code)).toEqual(["unapproved-scenario"]);
	});

	test("fails on a test for an unknown scenario", () => {
		const failures = runChecks({
			scenarios: [],
			decisions: [],
			markers: [marker("tests/a.test.ts", "S-99")],
			sealedHashes: {},
			currentHashes: {},
		});
		expect(failures.map((f) => f.code)).toEqual(["unknown-scenario"]);
	});

	test("fails on a reference to an unknown decision", () => {
		const failures = runChecks({
			scenarios: [],
			decisions: [],
			markers: [marker("tests/a.test.ts", "D-99")],
			sealedHashes: {},
			currentHashes: {},
		});
		expect(failures.map((f) => f.code)).toEqual(["unknown-decision"]);
	});

	test("fails on a hand-edited generated file", () => {
		const failures = runChecks({
			scenarios: [],
			decisions: [],
			markers: [],
			sealedHashes: { "src/gen/schema.ts": "aaa" },
			currentHashes: { "src/gen/schema.ts": "bbb" },
		});
		expect(failures.map((f) => f.code)).toEqual(["hand-edit"]);
	});

	test("fails on a deleted generated file", () => {
		const failures = runChecks({
			scenarios: [],
			decisions: [],
			markers: [],
			sealedHashes: { "src/gen/schema.ts": "aaa" },
			currentHashes: {},
		});
		expect(failures.map((f) => f.code)).toEqual(["generated-file-missing"]);
	});

	test("ignores draft scenarios without tests", () => {
		const failures = runChecks({
			scenarios: [scenario("S-01", "draft")],
			decisions: [],
			markers: [],
			sealedHashes: {},
			currentHashes: {},
		});
		expect(failures).toEqual([]);
	});
});
