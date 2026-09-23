import { err, ok, type Result } from "./result.js";

export type Decision = {
	id: string;
	title: string;
	decidedBy: string;
	because: string;
	supersedes: string | null;
};

const headingPattern = /^#\s+(D-\d+):\s*(.+)$/;
const decidedByPattern = /^Decided by:\s*(.+)$/;
const becausePattern = /^Because:\s*(.+)$/;
const supersedesPattern = /^Supersedes:\s*(.+)$/;

export const parseDecision = (content: string): Result<Decision, string> => {
	const lines = content.split("\n");
	const heading = lines[0]?.match(headingPattern);
	if (!heading) {
		return err("first line must be '# D-NNN: title'");
	}
	let decidedBy = "";
	let because = "";
	let supersedes: string | null = null;
	for (const line of lines.slice(1)) {
		const decidedMatch = line.match(decidedByPattern);
		if (decidedMatch) {
			decidedBy = decidedMatch[1];
			continue;
		}
		const becauseMatch = line.match(becausePattern);
		if (becauseMatch) {
			because = becauseMatch[1];
			continue;
		}
		const supersedesMatch = line.match(supersedesPattern);
		if (supersedesMatch) {
			supersedes = supersedesMatch[1];
		}
	}
	if (!decidedBy) {
		return err("missing 'Decided by:' line");
	}
	if (!because) {
		return err("missing 'Because:' line");
	}
	return ok({
		id: heading[1],
		title: heading[2].trim(),
		decidedBy,
		because,
		supersedes,
	});
};

export const formatDecision = (decision: Decision): string => {
	const supersedes = decision.supersedes
		? `\nSupersedes: ${decision.supersedes}`
		: "";
	return `# ${decision.id}: ${decision.title}\n\nDecided by: ${decision.decidedBy}\nBecause: ${decision.because}${supersedes}\n`;
};

export const nextDecisionId = (existing: string[]): string => {
	const highest = existing.reduce((max, id) => {
		const n = Number(id.slice(2));
		return Number.isFinite(n) ? Math.max(max, n) : max;
	}, 0);
	return `D-${String(highest + 1).padStart(3, "0")}`;
};
