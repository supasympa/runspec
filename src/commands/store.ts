import { join, relative } from "node:path";
import { fileExists, listMarkdown, readText } from "../adapters/fs-store.js";
import { type Decision, parseDecision } from "../domain/decision.js";
import type { Source } from "../domain/identity.js";
import { err, ok, type Result } from "../domain/result.js";
import { parseScenario, type Scenario } from "../domain/scenario.js";
import type { RunspecConfig } from "./config.js";

export type LoadResult<T> = { items: T[]; errors: string[]; sources: Source[] };

const load = <T extends { id: string }>(
	cwd: string,
	dir: string,
	parse: (content: string) => Result<T, string>,
): LoadResult<T> => {
	const loaded: LoadResult<T> = { items: [], errors: [], sources: [] };
	for (const path of listMarkdown(join(cwd, dir))) {
		const file = relative(cwd, path);
		const result = parse(readText(path));
		if (result.ok) {
			loaded.items.push(result.value);
			loaded.sources.push({ file, id: result.value.id });
		} else {
			loaded.errors.push(`${file}: ${result.error}`);
		}
	}
	return loaded;
};

export const loadScenarios = (
	cwd: string,
	config: Pick<RunspecConfig, "scenariosDir">,
): LoadResult<Scenario> => load(cwd, config.scenariosDir, parseScenario);

export const loadDecisions = (
	cwd: string,
	config: Pick<RunspecConfig, "decisionsDir">,
): LoadResult<Decision> => load(cwd, config.decisionsDir, parseDecision);

export const readSeals = (
	cwd: string,
): Result<Record<string, string>, string> => {
	const path = join(cwd, ".runspec", "seals.json");
	if (!fileExists(path)) {
		return ok({});
	}
	try {
		const parsed: unknown = JSON.parse(readText(path));
		if (typeof parsed !== "object" || parsed === null) {
			return err(".runspec/seals.json must be an object");
		}
		return ok(parsed as Record<string, string>);
	} catch {
		return err(".runspec/seals.json is not valid JSON");
	}
};
