import { join } from "node:path";
import { ensureDir, fileExists, writeText } from "../adapters/fs-store.js";
import { configPath, defaultConfig } from "./config.js";
import { agentCommands } from "./templates/agent-commands.js";
import { agentsMd, claudeMd } from "./templates/claude-md.js";

export const runInit = (cwd: string): number => {
	for (const dir of [
		"scenarios",
		"decisions",
		".runspec",
		".claude/commands",
	]) {
		ensureDir(join(cwd, dir));
	}
	if (!fileExists(configPath(cwd))) {
		writeText(configPath(cwd), `${JSON.stringify(defaultConfig, null, 2)}\n`);
	}
	if (!fileExists(join(cwd, "CLAUDE.md"))) {
		writeText(join(cwd, "CLAUDE.md"), claudeMd);
	}
	if (!fileExists(join(cwd, "AGENTS.md"))) {
		writeText(join(cwd, "AGENTS.md"), agentsMd);
	}
	for (const [name, body] of Object.entries(agentCommands())) {
		const path = join(cwd, ".claude", "commands", `${name}.md`);
		if (!fileExists(path)) {
			writeText(path, body);
		}
	}
	console.log("runspec initialised.");
	console.log(
		"  scenarios/         Given/Then examples, owned by the stakeholder",
	);
	console.log("  decisions/         D-NNN records, append-only");
	console.log("  .runspec/          seals");
	console.log("  runspec.json        testGlobs and generatedGlobs");
	console.log("  CLAUDE.md           the process, for Claude and other agents");
	console.log(
		"  .claude/commands/   /interview /scenario /model /tests /decide /ask",
	);
	console.log(`\nnext: runspec scenario add "<title>"`);
	return 0;
};
