import { join } from "node:path";
import { ensureDir, fileExists, writeText } from "../adapters/fs-store.js";
import { configPath, defaultConfig } from "./config.js";
import { agentsMd } from "./templates/agent-md.js";
import { commandSpecs } from "./templates/commands.js";

export const runInit = (cwd: string): number => {
	for (const dir of ["scenarios", "decisions", ".runspec", "commands"]) {
		ensureDir(join(cwd, dir));
	}
	if (!fileExists(configPath(cwd))) {
		writeText(configPath(cwd), `${JSON.stringify(defaultConfig, null, 2)}\n`);
	}
	const agentsMdPath = join(cwd, "AGENTS.md");
	if (!fileExists(agentsMdPath)) {
		writeText(agentsMdPath, agentsMd);
	}
	for (const [name, spec] of Object.entries(commandSpecs())) {
		const path = join(cwd, "commands", `${name}.md`);
		if (!fileExists(path)) {
			writeText(path, spec.body);
		}
	}
	console.log("runspec initialised.");
	console.log("  scenarios/    Given/Then examples, owned by the stakeholder");
	console.log("  decisions/    D-NNN records, append-only");
	console.log("  commands/     six agent prompts, plain markdown");
	console.log("  .runspec/     seals");
	console.log("  runspec.json  testGlobs and generatedGlobs");
	console.log("  AGENTS.md     the process, for any agent that reads it");
	console.log(
		"\nnext: runspec install <agent>   (claude, cursor, gemini, codex)",
	);
	return 0;
};
