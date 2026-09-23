#!/usr/bin/env bun
import { runCheck } from "./commands/check.js";
import { runDecision } from "./commands/decision.js";
import { runInit } from "./commands/init.js";
import { runScenario } from "./commands/scenario.js";
import { runSeal } from "./commands/seal.js";
import { runStatus } from "./commands/status.js";

const usage = `runspec: the spec that runs

usage: runspec <command>

  init                              set up scenarios/, decisions/, config and agent files
  scenario add <title>              draft a new scenario
  scenario list                     list scenarios with status
  scenario approve <id> --by <who>  approve a scenario (approving it approves its test)
  decision add <title> --by <who> --because <why> [--supersedes <id>]
  decision list                     list decisions
  seal                              record hashes of generated files
  check                             verify traceability and seals (run before every commit)
  status                            counts of each artefact`;

const cwd = process.cwd();
const [command = "help", ...args] = process.argv.slice(2);

const commands: Record<string, () => number> = {
	init: () => runInit(cwd),
	scenario: () => runScenario(cwd, args),
	decision: () => runDecision(cwd, args),
	seal: () => runSeal(cwd),
	check: () => runCheck(cwd),
	status: () => runStatus(cwd),
};

if (command === "help") {
	console.log(usage);
	process.exit(0);
}

const run = commands[command];
if (!run) {
	console.log(`unknown command: ${command}\n\n${usage}`);
	process.exit(1);
}
process.exit(run());
