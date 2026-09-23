import type { Decision } from "./decision.js";

type Failure = { code: string; message: string };

/** Maps each superseded decision id to the id of the decision that replaced it. */
export const successors = (decisions: Decision[]): Map<string, string> =>
	new Map(
		decisions.flatMap((d) => (d.supersedes ? [[d.supersedes, d.id]] : [])),
	);

export const supersedesFailures = (decisions: Decision[]): Failure[] => {
	const ids = new Set(decisions.map((d) => d.id));
	return decisions
		.filter(
			(d) =>
				d.supersedes !== null &&
				(d.supersedes === d.id || !ids.has(d.supersedes)),
		)
		.map((d) => ({
			code: "unknown-supersedes",
			message: `${d.id} supersedes ${d.supersedes}, which is not another recorded decision. Point 'Supersedes:' at the decision it replaces.`,
		}));
};
