/** Where a scenario or decision was read from. */
export type Source = { file: string; id: string };

type Failure = { code: string; message: string };

const fileName = (file: string): string => file.split(/[\\/]/).pop() ?? file;

const duplicateFailures = (sources: Source[]): Failure[] => {
	const filesById = Map.groupBy(sources, (s) => s.id);
	return [...filesById.entries()]
		.filter(([, claims]) => claims.length > 1)
		.map(([id, claims]) => ({
			code: "duplicate-id",
			message: `${id} is claimed by more than one file: ${claims.map((c) => c.file).join(", ")}. Renumber all but one.`,
		}));
};

const misnamedFailures = (sources: Source[]): Failure[] =>
	sources
		.filter((s) => fileName(s.file) !== `${s.id}.md`)
		.map((s) => ({
			code: "misnamed-file",
			message: `${s.file} holds ${s.id}, so it must be named ${s.id}.md`,
		}));

export const identityFailures = (sources: Source[]): Failure[] => [
	...duplicateFailures(sources),
	...misnamedFailures(sources),
];
