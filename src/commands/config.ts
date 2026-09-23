import { join } from "node:path";
import { fileExists, readText } from "../adapters/fs-store.js";
import { err, ok, type Result } from "../domain/result.js";

export type RunspecConfig = {
	testGlobs: string[];
	generatedGlobs: string[];
};

export const defaultConfig: RunspecConfig = {
	testGlobs: ["tests/**"],
	generatedGlobs: [],
};

export const configPath = (cwd: string): string => join(cwd, "runspec.json");

export const parseConfig = (content: string): Result<RunspecConfig, string> => {
	let parsed: unknown;
	try {
		parsed = JSON.parse(content);
	} catch {
		return err("runspec.json is not valid JSON");
	}
	if (typeof parsed !== "object" || parsed === null) {
		return err("runspec.json must be an object");
	}
	const candidate = parsed as Record<string, unknown>;
	const isStringArray = (value: unknown): value is string[] =>
		Array.isArray(value) && value.every((g) => typeof g === "string");
	if (!isStringArray(candidate.testGlobs)) {
		return err("testGlobs must be an array of strings");
	}
	if (!isStringArray(candidate.generatedGlobs)) {
		return err("generatedGlobs must be an array of strings");
	}
	return ok({
		testGlobs: candidate.testGlobs,
		generatedGlobs: candidate.generatedGlobs,
	});
};

export const loadConfig = (cwd: string): Result<RunspecConfig, string> => {
	const path = configPath(cwd);
	if (!fileExists(path)) {
		return err("not initialised: run 'runspec init' first");
	}
	return parseConfig(readText(path));
};
