import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { Glob } from "bun";
import type { SourceFile } from "../domain/traceability.js";

export const ensureDir = (path: string): void => {
	mkdirSync(path, { recursive: true });
};

export const readText = (path: string): string => readFileSync(path, "utf8");

export const writeText = (path: string, content: string): void => {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, content);
};

export const fileExists = (path: string): boolean => existsSync(path);

export const listMarkdown = (dir: string): string[] =>
	existsSync(dir)
		? readdirSync(dir)
				.filter((name) => name.endsWith(".md"))
				.map((name) => join(dir, name))
				.sort()
		: [];

export const readTextFiles = (globs: string[], cwd: string): SourceFile[] => {
	const seen = new Set<string>();
	const files: SourceFile[] = [];
	for (const pattern of globs) {
		for (const path of new Glob(pattern).scanSync({ cwd, onlyFiles: true })) {
			if (seen.has(path)) {
				continue;
			}
			seen.add(path);
			files.push({ path, content: readText(join(cwd, path)) });
		}
	}
	return files;
};
