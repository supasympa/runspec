import { err, ok, type Result } from "./result.js";

export type Decision = {
	id: string;
	title: string;
	decidedBy: string;
	/** ISO date (YYYY-MM-DD). Null on records written before dates were kept. */
	date: string | null;
	because: string;
	supersedes: string | null;
};

type Fields = Omit<Decision, "id" | "title">;

const headingPattern = /^#\s+(D-\d+):\s*(.+)$/;

const fieldPatterns: [RegExp, keyof Fields][] = [
	[/^Decided by:\s*(.+)$/, "decidedBy"],
	[/^Date:\s*(\d{4}-\d{2}-\d{2})\s*$/, "date"],
	[/^Because:\s*(.+)$/, "because"],
	[/^Supersedes:\s*(.+)$/, "supersedes"],
];

const readField = (line: string): [keyof Fields, string][] =>
	fieldPatterns.flatMap(([pattern, key]) => {
		const match = line.match(pattern);
		return match ? [[key, match[1]] as [keyof Fields, string]] : [];
	});

const readFields = (lines: string[]): Fields => ({
	decidedBy: "",
	date: null,
	because: "",
	supersedes: null,
	...Object.fromEntries(lines.flatMap(readField)),
});

export const parseDecision = (content: string): Result<Decision, string> => {
	const lines = content.split("\n");
	const heading = lines[0]?.match(headingPattern);
	if (!heading) {
		return err("first line must be '# D-NNN: title'");
	}
	const fields = readFields(lines.slice(1));
	if (!fields.decidedBy) {
		return err("missing 'Decided by:' line");
	}
	if (!fields.because) {
		return err("missing 'Because:' line");
	}
	return ok({ id: heading[1], title: heading[2].trim(), ...fields });
};

export const formatDecision = (decision: Decision): string => {
	const date = decision.date ? `\nDate: ${decision.date}` : "";
	const supersedes = decision.supersedes
		? `\nSupersedes: ${decision.supersedes}`
		: "";
	return `# ${decision.id}: ${decision.title}\n\nDecided by: ${decision.decidedBy}${date}\nBecause: ${decision.because}${supersedes}\n`;
};

export const nextDecisionId = (existing: string[]): string => {
	const highest = existing.reduce((max, id) => {
		const n = Number(id.slice(2));
		return Number.isFinite(n) ? Math.max(max, n) : max;
	}, 0);
	return `D-${String(highest + 1).padStart(3, "0")}`;
};
