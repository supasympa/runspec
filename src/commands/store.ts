import { join } from "node:path";
import { fileExists, listMarkdown, readText } from "../adapters/fs-store.js";
import { type Decision, parseDecision } from "../domain/decision.js";
import { err, ok, type Result } from "../domain/result.js";
import { parseScenario, type Scenario } from "../domain/scenario.js";

export type LoadResult<T> = { items: T[]; errors: string[] };

const load = <T>(
	dir: string,
	parse: (content: string) => Result<T, string>,
): LoadResult<T> => {
	const items: T[] = [];
	const errors: string[] = [];
	for (const path of listMarkdown(dir)) {
		const result = parse(readText(path));
		if (result.ok) {
			items.push(result.value);
		} else {
			errors.push(`${path}: ${result.error}`);
		}
	}
	return { items, errors };
};

export const loadScenarios = (cwd: string): LoadResult<Scenario> =>
	load(join(cwd, "scenarios"), parseScenario);

export const loadDecisions = (cwd: string): LoadResult<Decision> =>
	load(join(cwd, "decisions"), parseDecision);

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
