import { join } from "node:path";
import { fileExists, readText } from "../adapters/fs-store.js";
import { err, ok, type Result } from "../domain/result.js";

export type RunspecConfig = {
	testGlobs: string[];
	generatedGlobs: string[];
	scenariosDir: string;
	decisionsDir: string;
	commandsDir: string;
};

export const defaultConfig: RunspecConfig = {
	testGlobs: ["tests/**"],
	generatedGlobs: [],
	scenariosDir: "scenarios",
	decisionsDir: "decisions",
	commandsDir: "commands",
};

export const configPath = (cwd: string): string => join(cwd, "runspec.json");

const dirKeys = ["scenariosDir", "decisionsDir", "commandsDir"] as const;

const isStringArray = (value: unknown): value is string[] =>
	Array.isArray(value) && value.every((g) => typeof g === "string");

const isProjectDir = (value: unknown): value is string =>
	typeof value === "string" &&
	value.trim() !== "" &&
	!/^([\\/]|[A-Za-z]:)/.test(value) &&
	!value.split(/[\\/]/).includes("..");

const readDirs = (
	candidate: Record<string, unknown>,
): Result<Pick<RunspecConfig, (typeof dirKeys)[number]>, string> => {
	const dirs = { ...defaultConfig };
	for (const key of dirKeys) {
		const value = candidate[key];
		if (value === undefined) {
			continue;
		}
		if (!isProjectDir(value)) {
			return err(`${key} must be a relative path inside the project`);
		}
		dirs[key] = value.replace(/[\\/]+$/, "");
	}
	return ok(dirs);
};

const parseJsonObject = (
	content: string,
): Result<Record<string, unknown>, string> => {
	try {
		const parsed: unknown = JSON.parse(content);
		return typeof parsed === "object" && parsed !== null
			? ok(parsed as Record<string, unknown>)
			: err("runspec.json must be an object");
	} catch {
		return err("runspec.json is not valid JSON");
	}
};

export const parseConfig = (content: string): Result<RunspecConfig, string> => {
	const candidate = parseJsonObject(content);
	if (!candidate.ok) {
		return candidate;
	}
	const { testGlobs, generatedGlobs } = candidate.value;
	if (!isStringArray(testGlobs)) {
		return err("testGlobs must be an array of strings");
	}
	if (!isStringArray(generatedGlobs)) {
		return err("generatedGlobs must be an array of strings");
	}
	const dirs = readDirs(candidate.value);
	return dirs.ok ? ok({ ...dirs.value, testGlobs, generatedGlobs }) : dirs;
};

export const loadConfig = (cwd: string): Result<RunspecConfig, string> => {
	const path = configPath(cwd);
	if (!fileExists(path)) {
		return err("not initialised: run 'runspec init' first");
	}
	return parseConfig(readText(path));
};

/** The project's config, or the defaults when runspec.json has not been written yet. */
export const loadConfigOrDefault = (
	cwd: string,
): Result<RunspecConfig, string> =>
	fileExists(configPath(cwd)) ? loadConfig(cwd) : ok(defaultConfig);
