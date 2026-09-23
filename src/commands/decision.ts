import { join } from "node:path";
import { parseArgs } from "node:util";
import { writeText } from "../adapters/fs-store.js";
import {
	type Decision,
	formatDecision,
	nextDecisionId,
} from "../domain/decision.js";
import { loadDecisions } from "./store.js";

const usage =
	"usage: runspec decision add <title> --by <who> --because <why> [--supersedes <id>] | list";

const add = (cwd: string, args: string[]): number => {
	const { values, positionals } = parseArgs({
		args,
		options: {
			by: { type: "string" },
			because: { type: "string" },
			supersedes: { type: "string" },
		},
		allowPositionals: true,
	});
	const title = positionals.join(" ").trim();
	if (!title || !values.by || !values.because) {
		console.log(usage);
		return 1;
	}
	const { items, errors } = loadDecisions(cwd);
	for (const error of errors) {
		console.log(error);
	}
	const decision: Decision = {
		id: nextDecisionId(items.map((d) => d.id)),
		title,
		decidedBy: values.by,
		because: values.because,
		supersedes: values.supersedes ?? null,
	};
	const path = join(cwd, "decisions", `${decision.id}.md`);
	writeText(path, formatDecision(decision));
	console.log(path);
	return 0;
};

const list = (cwd: string): number => {
	const { items, errors } = loadDecisions(cwd);
	for (const error of errors) {
		console.log(error);
	}
	if (items.length === 0) {
		console.log("no decisions yet.");
		return 0;
	}
	for (const d of items) {
		const supersedes = d.supersedes ? ` (supersedes ${d.supersedes})` : "";
		console.log(`${d.id}  ${d.title}${supersedes}`);
	}
	return 0;
};

export const runDecision = (cwd: string, args: string[]): number => {
	const [sub, ...rest] = args;
	if (sub === "add") {
		return add(cwd, rest);
	}
	if (sub === "list") {
		return list(cwd);
	}
	console.log(usage);
	return 1;
};
