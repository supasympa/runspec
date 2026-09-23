import { describe, expect, test } from "bun:test";
import { type CheckInput, runChecks } from "../domain/check.js";
import type { Decision } from "../domain/decision.js";
import type { Scenario } from "../domain/scenario.js";
import type { Marker } from "../domain/traceability.js";

const hash = (text: string): string => `h(${text})`;

const body = "Given\nThen 1.";

const scenario = (id: string, status: Scenario["status"]): Scenario => ({
	id,
	title: `scenario ${id}`,
	status,
	approvedBy: status === "approved" ? "someone" : null,
	approvedHash: status === "approved" ? hash(body) : null,
	body,
});

const decision = (id: string): Decision => ({
	id,
	title: `decision ${id}`,
	decidedBy: "someone",
	date: "2026-09-22",
	because: "reason",
	supersedes: null,
});

const marker = (file: string, id: string): Marker => ({
	file,
	kind: id.startsWith("S-") ? "scenario" : "decision",
	id,
});

const input = (overrides: Partial<CheckInput>): CheckInput => ({
	scenarios: [],
	decisions: [],
	markers: [],
	sealedHashes: {},
	currentHashes: {},
	sources: [],
	hash,
	...overrides,
});

const codes = (overrides: Partial<CheckInput>): string[] =>
	runChecks(input(overrides)).map((f) => f.code);

describe("runChecks", () => {
	test("passes when everything traces", () => {
		expect(
			codes({
				scenarios: [scenario("S-01", "approved")],
				decisions: [decision("D-001")],
				markers: [
					marker("tests/a.test.ts", "S-01"),
					marker("tests/b.test.ts", "D-001"),
				],
			}),
		).toEqual([]);
	});

	test("fails on an approved scenario with no test", () => {
		expect(codes({ scenarios: [scenario("S-01", "approved")] })).toEqual([
			"missing-test",
		]);
	});

	test("fails on a test for an unapproved scenario", () => {
		expect(
			codes({
				scenarios: [scenario("S-01", "draft")],
				markers: [marker("tests/a.test.ts", "S-01")],
			}),
		).toEqual(["unapproved-scenario"]);
	});

	test("fails on a test for an unknown scenario", () => {
		expect(codes({ markers: [marker("tests/a.test.ts", "S-99")] })).toEqual([
			"unknown-scenario",
		]);
	});

	test("fails on a reference to an unknown decision", () => {
		expect(codes({ markers: [marker("tests/a.test.ts", "D-99")] })).toEqual([
			"unknown-decision",
		]);
	});

	test("fails on a hand-edited generated file", () => {
		expect(
			codes({
				sealedHashes: { "src/gen/schema.ts": "aaa" },
				currentHashes: { "src/gen/schema.ts": "bbb" },
			}),
		).toEqual(["hand-edit"]);
	});

	test("fails on a deleted generated file", () => {
		expect(codes({ sealedHashes: { "src/gen/schema.ts": "aaa" } })).toEqual([
			"generated-file-missing",
		]);
	});

	test("fails on a generated file that was never sealed", () => {
		expect(codes({ currentHashes: { "src/gen/new.ts": "ccc" } })).toEqual([
			"unsealed",
		]);
	});

	test("ignores draft scenarios without tests", () => {
		expect(codes({ scenarios: [scenario("S-01", "draft")] })).toEqual([]);
	});
});

describe("approval", () => {
	test("fails on a scenario edited after approval", () => {
		const edited = { ...scenario("S-01", "approved"), body: "Then 1. other" };
		const failures = runChecks(
			input({
				scenarios: [edited],
				markers: [marker("tests/a.test.ts", "S-01")],
			}),
		);
		expect(failures.map((f) => f.code)).toEqual(["edited-after-approval"]);
		expect(failures[0].message).toContain("runspec scenario approve S-01");
	});

	test("fails on an approved scenario with no approval hash", () => {
		const unhashed = { ...scenario("S-01", "approved"), approvedHash: null };
		expect(
			codes({
				scenarios: [unhashed],
				markers: [marker("tests/a.test.ts", "S-01")],
			}),
		).toEqual(["approval-without-hash"]);
	});
});

describe("identity", () => {
	test("fails when two files claim the same id", () => {
		const failures = runChecks(
			input({
				sources: [
					{ file: "scenarios/S-01.md", id: "S-01" },
					{ file: "scenarios/copy.md", id: "S-01" },
				],
			}),
		);
		expect(failures.map((f) => f.code)).toContain("duplicate-id");
		expect(failures.find((f) => f.code === "duplicate-id")?.message).toContain(
			"scenarios/S-01.md, scenarios/copy.md",
		);
	});

	test("fails when a file is not named after its id", () => {
		expect(
			codes({ sources: [{ file: "decisions/rule.md", id: "D-001" }] }),
		).toEqual(["misnamed-file"]);
	});

	test("accepts files named after their ids", () => {
		expect(
			codes({
				sources: [
					{ file: "scenarios/S-01.md", id: "S-01" },
					{ file: "decisions/D-001.md", id: "D-001" },
				],
			}),
		).toEqual([]);
	});
});

describe("supersession", () => {
	const replacing = (id: string, supersedes: string): Decision => ({
		...decision(id),
		supersedes,
	});

	test("fails when a decision supersedes one that does not exist", () => {
		expect(
			codes({ decisions: [decision("D-001"), replacing("D-002", "D-999")] }),
		).toEqual(["unknown-supersedes"]);
	});

	test("fails when a decision supersedes itself", () => {
		expect(codes({ decisions: [replacing("D-001", "D-001")] })).toEqual([
			"unknown-supersedes",
		]);
	});

	test("fails on a reference to a superseded decision, naming its successor", () => {
		const failures = runChecks(
			input({
				decisions: [decision("D-001"), replacing("D-002", "D-001")],
				markers: [marker("tests/a.test.ts", "D-001")],
			}),
		);
		expect(failures.map((f) => f.code)).toEqual(["superseded-decision"]);
		expect(failures[0].message).toContain("D-002");
	});

	test("fails on a test for a superseded scenario", () => {
		expect(
			codes({
				scenarios: [scenario("S-01", "superseded")],
				markers: [marker("tests/a.test.ts", "S-01")],
			}),
		).toEqual(["superseded-scenario"]);
	});
});
