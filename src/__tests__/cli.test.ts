import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileExists, readText, writeText } from "../adapters/fs-store.js";
import { runCheck } from "../commands/check.js";
import { runDecision } from "../commands/decision.js";
import { runInit } from "../commands/init.js";
import { runInstall } from "../commands/install.js";
import { runScenario } from "../commands/scenario.js";
import { runSeal } from "../commands/seal.js";
import { runStatus } from "../commands/status.js";

const makeProject = (): string => mkdtempSync(join(tmpdir(), "runspec-"));

describe("the loop end to end", () => {
	test("interview to seal to hand-edit detection", () => {
		const cwd = makeProject();
		try {
			expect(runInit(cwd)).toBe(0);
			expect(fileExists(join(cwd, "AGENTS.md"))).toBe(true);
			expect(fileExists(join(cwd, "commands", "interview.md"))).toBe(true);
			expect(fileExists(join(cwd, ".claude"))).toBe(false);

			expect(runScenario(cwd, ["add", "sickness cancellation"])).toBe(0);
			const s01 = join(cwd, "scenarios", "S-01.md");
			writeText(
				s01,
				readText(s01).replace(
					"Given\nThen 1.",
					"Given a patient cancels because of sickness\nThen 1. no charge is made",
				),
			);
			expect(runCheck(cwd)).toBe(0);

			expect(runScenario(cwd, ["approve", "S-01", "--by", "S. Okafor"])).toBe(
				0,
			);
			expect(runCheck(cwd)).toBe(1);

			writeText(join(cwd, "tests", "s01.test.ts"), "// runspec: S-01\n");
			expect(runCheck(cwd)).toBe(0);

			expect(
				runDecision(cwd, [
					"add",
					"No changes after check-in",
					"--by",
					"S. Okafor",
					"--because",
					"stable list",
				]),
			).toBe(0);
			writeText(join(cwd, "tests", "d001.test.ts"), "// runspec: D-001\n");
			expect(runCheck(cwd)).toBe(0);

			writeText(join(cwd, "tests", "d999.test.ts"), "// runspec: D-999\n");
			expect(runCheck(cwd)).toBe(1);
			rmSync(join(cwd, "tests", "d999.test.ts"));
			expect(runCheck(cwd)).toBe(0);

			writeText(
				join(cwd, "runspec.json"),
				`${JSON.stringify({
					testGlobs: ["tests/**"],
					generatedGlobs: ["src/gen/**"],
				})}\n`,
			);
			writeText(join(cwd, "src", "gen", "schema.ts"), "export {}\n");
			expect(runSeal(cwd)).toBe(0);
			expect(runCheck(cwd)).toBe(0);

			writeText(join(cwd, "src", "gen", "schema.ts"), "export const x = 1;\n");
			expect(runCheck(cwd)).toBe(1);

			expect(runSeal(cwd)).toBe(0);
			expect(runCheck(cwd)).toBe(0);
			expect(runStatus(cwd)).toBe(0);
		} finally {
			rmSync(cwd, { recursive: true, force: true });
		}
	});

	test("install adapts commands for an agent", () => {
		const cwd = makeProject();
		try {
			expect(runInit(cwd)).toBe(0);
			expect(runInstall(cwd, ["claude"])).toBe(0);
			expect(fileExists(join(cwd, ".claude", "commands", "interview.md"))).toBe(
				true,
			);
			expect(fileExists(join(cwd, "CLAUDE.md"))).toBe(true);
			expect(runInstall(cwd, ["claude"])).toBe(0);
			expect(runInstall(cwd, ["unknown-agent"])).toBe(1);
		} finally {
			rmSync(cwd, { recursive: true, force: true });
		}
	});

	test("editing an approved scenario fails until it is approved again", () => {
		const cwd = makeProject();
		try {
			runInit(cwd);
			runScenario(cwd, ["add", "no charge"]);
			runScenario(cwd, ["approve", "S-01", "--by", "S. Okafor"]);
			writeText(join(cwd, "tests", "s01.test.ts"), "// runspec: S-01\n");
			expect(runCheck(cwd)).toBe(0);

			const s01 = join(cwd, "scenarios", "S-01.md");
			writeText(s01, readText(s01).replace("Then 1.", "Then 1. a charge"));
			expect(runCheck(cwd)).toBe(1);

			runScenario(cwd, ["approve", "S-01", "--by", "S. Okafor"]);
			expect(runCheck(cwd)).toBe(0);
		} finally {
			rmSync(cwd, { recursive: true, force: true });
		}
	});

	test("check fails outside an initialised project", () => {
		const cwd = makeProject();
		try {
			expect(runCheck(cwd)).toBe(1);
		} finally {
			rmSync(cwd, { recursive: true, force: true });
		}
	});
});
