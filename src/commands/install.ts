import { join } from "node:path";
import { writeAgentFile } from "../adapters/agent-file.js";
import { ensureDir, fileExists, writeText } from "../adapters/fs-store.js";
import { loadConfigOrDefault } from "./config.js";
import {
	agentsMd,
	pointerMd,
	type RunspecDirs,
	withRunspecSection,
} from "./templates/agent-md.js";
import { commandSpecs } from "./templates/commands.js";

const claudeFrontmatter = (description: string): string =>
	`---\ndescription: ${description}\n---\n`;

const installClaude = (cwd: string, dirs: RunspecDirs): string[] => {
	ensureDir(join(cwd, ".claude", "commands"));
	const written: string[] = [];
	if (writeAgentFile(join(cwd, "CLAUDE.md"), pointerMd, withRunspecSection)) {
		written.push("CLAUDE.md");
	}
	for (const [name, spec] of Object.entries(commandSpecs(dirs))) {
		const path = join(cwd, ".claude", "commands", `${name}.md`);
		if (!fileExists(path)) {
			writeText(path, `${claudeFrontmatter(spec.description)}${spec.body}`);
			written.push(path);
		}
	}
	return written;
};

const installCursor = (cwd: string, dirs: RunspecDirs): string[] => {
	ensureDir(join(cwd, ".cursor", "rules"));
	const path = join(cwd, ".cursor", "rules", "runspec.mdc");
	if (fileExists(path)) {
		return [];
	}
	writeText(
		path,
		`---\ndescription: runspec process\nalwaysApply: true\n---\n${agentsMd(dirs)}`,
	);
	return [path];
};

const installGemini = (cwd: string): string[] => {
	const path = join(cwd, "GEMINI.md");
	return writeAgentFile(path, pointerMd, withRunspecSection) ? [path] : [];
};

const installers: Record<string, (cwd: string, dirs: RunspecDirs) => string[]> =
	{
		claude: installClaude,
		cursor: installCursor,
		gemini: installGemini,
		codex: () => [],
	};

export const runInstall = (cwd: string, args: string[]): number => {
	const agent = args[0];
	const installer = agent ? installers[agent] : undefined;
	if (!installer) {
		console.log("usage: runspec install <agent>");
		console.log(`agents: ${Object.keys(installers).join(", ")}`);
		console.log("codex and anything else reading AGENTS.md needs no install.");
		return 1;
	}
	const config = loadConfigOrDefault(cwd);
	if (!config.ok) {
		console.log(config.error);
		return 1;
	}
	const written = installer(cwd, config.value);
	if (written.length === 0) {
		console.log(`${agent}: nothing to do, already installed.`);
	} else {
		console.log(`Installed for ${agent}:`);
		for (const path of written) {
			console.log(`  ${path}`);
		}
	}
	return 0;
};
