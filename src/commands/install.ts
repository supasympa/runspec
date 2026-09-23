import { join } from "node:path";
import { ensureDir, fileExists, writeText } from "../adapters/fs-store.js";
import { agentsMd, pointerMd } from "./templates/agent-md.js";
import { commandSpecs } from "./templates/commands.js";

const claudeFrontmatter = (description: string): string =>
	`---\ndescription: ${description}\n---\n`;

const installClaude = (cwd: string): string[] => {
	ensureDir(join(cwd, ".claude", "commands"));
	const written: string[] = [];
	const claudeMd = join(cwd, "CLAUDE.md");
	if (!fileExists(claudeMd)) {
		writeText(claudeMd, pointerMd);
		written.push("CLAUDE.md");
	}
	for (const [name, spec] of Object.entries(commandSpecs())) {
		const path = join(cwd, ".claude", "commands", `${name}.md`);
		if (!fileExists(path)) {
			writeText(path, `${claudeFrontmatter(spec.description)}${spec.body}`);
			written.push(path);
		}
	}
	return written;
};

const installCursor = (cwd: string): string[] => {
	ensureDir(join(cwd, ".cursor", "rules"));
	const path = join(cwd, ".cursor", "rules", "runspec.mdc");
	if (fileExists(path)) {
		return [];
	}
	writeText(
		path,
		`---\ndescription: runspec process\nalwaysApply: true\n---\n${agentsMd}`,
	);
	return [path];
};

const installGemini = (cwd: string): string[] => {
	const path = join(cwd, "GEMINI.md");
	if (fileExists(path)) {
		return [];
	}
	writeText(path, pointerMd);
	return [path];
};

const installers: Record<string, (cwd: string) => string[]> = {
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
	const written = installer(cwd);
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
