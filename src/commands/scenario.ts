import { join } from "node:path";
import { parseArgs } from "node:util";
import { fileExists, readText, writeText } from "../adapters/fs-store.js";
import {
	approveScenario,
	formatScenario,
	nextScenarioId,
	parseScenario,
	type Scenario,
} from "../domain/scenario.js";
import { loadScenarios } from "./store.js";

const usage =
	"usage: runspec scenario add <title> | list | approve <id> --by <who>";

const add = (cwd: string, args: string[]): number => {
	const title = args.join(" ").trim();
	if (!title) {
		console.log("usage: runspec scenario add <title>");
		return 1;
	}
	const { items, errors } = loadScenarios(cwd);
	for (const error of errors) {
		console.log(error);
	}
	const id = nextScenarioId(items.map((s) => s.id));
	const scenario: Scenario = {
		id,
		title,
		status: "draft",
		approvedBy: null,
		body: "Given\nThen 1.",
	};
	const path = join(cwd, "scenarios", `${id}.md`);
	writeText(path, formatScenario(scenario));
	console.log(path);
	console.log(
		`Write the Given/Then body in the stakeholder's words, then: runspec scenario approve ${id} --by "<who>"`,
	);
	return 0;
};

const list = (cwd: string): number => {
	const { items, errors } = loadScenarios(cwd);
	for (const error of errors) {
		console.log(error);
	}
	if (items.length === 0) {
		console.log("no scenarios yet. runspec scenario add <title>");
		return 0;
	}
	for (const s of items) {
		console.log(`${s.id}  ${s.status.padEnd(9)}  ${s.title}`);
	}
	return 0;
};

const approve = (cwd: string, args: string[]): number => {
	const { values, positionals } = parseArgs({
		args,
		options: { by: { type: "string" } },
		allowPositionals: true,
	});
	const id = positionals[0];
	const by = values.by;
	if (!id || !by) {
		console.log("usage: runspec scenario approve <id> --by <who>");
		return 1;
	}
	const path = join(cwd, "scenarios", `${id}.md`);
	if (!fileExists(path)) {
		console.log(`no scenario ${id}`);
		return 1;
	}
	const parsed = parseScenario(readText(path));
	if (!parsed.ok) {
		console.log(`${path}: ${parsed.error}`);
		return 1;
	}
	writeText(path, formatScenario(approveScenario(parsed.value, by)));
	console.log(`${id} approved by ${by}. Its test now counts.`);
	return 0;
};

export const runScenario = (cwd: string, args: string[]): number => {
	const [sub, ...rest] = args;
	if (sub === "add") {
		return add(cwd, rest);
	}
	if (sub === "list") {
		return list(cwd);
	}
	if (sub === "approve") {
		return approve(cwd, rest);
	}
	console.log(usage);
	return 1;
};
