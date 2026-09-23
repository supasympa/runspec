import { join } from "node:path";
import { ensureDir, fileExists, writeText } from "../adapters/fs-store.js";
import {
	configPath,
	loadConfigOrDefault,
	type RunspecConfig,
} from "./config.js";
import { agentsMd } from "./templates/agent-md.js";
import { commandSpecs } from "./templates/commands.js";

const writeProjectFiles = (cwd: string, config: RunspecConfig): void => {
	for (const dir of [
		config.scenariosDir,
		config.decisionsDir,
		config.commandsDir,
		".runspec",
	]) {
		ensureDir(join(cwd, dir));
	}
	if (!fileExists(configPath(cwd))) {
		writeText(configPath(cwd), `${JSON.stringify(config, null, 2)}\n`);
	}
	const agentsMdPath = join(cwd, "AGENTS.md");
	if (!fileExists(agentsMdPath)) {
		writeText(agentsMdPath, agentsMd(config));
	}
	for (const [name, spec] of Object.entries(commandSpecs(config))) {
		const path = join(cwd, config.commandsDir, `${name}.md`);
		if (!fileExists(path)) {
			writeText(path, spec.body);
		}
	}
};

export const runInit = (cwd: string): number => {
	const config = loadConfigOrDefault(cwd);
	if (!config.ok) {
		console.log(config.error);
		return 1;
	}
	writeProjectFiles(cwd, config.value);
	const { scenariosDir, decisionsDir, commandsDir } = config.value;
	console.log("runspec initialised.");
	console.log(
		`  ${scenariosDir}/  Given/Then examples, owned by the stakeholder`,
	);
	console.log(`  ${decisionsDir}/  D-NNN records, append-only`);
	console.log(`  ${commandsDir}/  six agent prompts, plain markdown`);
	console.log("  .runspec/  seals");
	console.log("  runspec.json  test and generated globs, and these folders");
	console.log("  AGENTS.md  the process, for any agent that reads it");
	console.log(
		"\nnext: runspec install <agent>   (claude, cursor, gemini, codex)",
	);
	return 0;
};
