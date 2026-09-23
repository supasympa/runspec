import { describe, expect, test } from "bun:test";
import { defaultConfig, parseConfig } from "../commands/config.js";

const globs = { testGlobs: ["tests/**"], generatedGlobs: [] };

describe("parseConfig", () => {
	test("defaults the folders when they are not given", () => {
		const parsed = parseConfig(JSON.stringify(globs));
		expect(parsed).toEqual({ ok: true, value: defaultConfig });
	});

	test("reads configured folders", () => {
		const parsed = parseConfig(
			JSON.stringify({
				...globs,
				scenariosDir: "docs/scenarios",
				decisionsDir: "docs/adr",
				commandsDir: "docs/runspec",
			}),
		);
		expect(parsed.ok && parsed.value.decisionsDir).toBe("docs/adr");
		expect(parsed.ok && parsed.value.commandsDir).toBe("docs/runspec");
	});

	test.each([
		["an absolute path", "/etc"],
		["a path out of the project", "../elsewhere"],
		["an empty path", ""],
		["something other than a string", 3],
	])("rejects %s", (_, dir) => {
		expect(
			parseConfig(JSON.stringify({ ...globs, scenariosDir: dir })).ok,
		).toBe(false);
	});
});
