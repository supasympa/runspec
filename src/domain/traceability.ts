export type SourceFile = { path: string; content: string };

export type MarkerKind = "scenario" | "decision";

export type Marker = {
	file: string;
	kind: MarkerKind;
	id: string;
};

const markerPattern = /runspec:\s*((?:S-\d+)|(?:D-\d+))/g;

export const findMarkers = (files: SourceFile[]): Marker[] =>
	files.flatMap((file) =>
		[...file.content.matchAll(markerPattern)].map((match) => ({
			file: file.path,
			kind: match[1].startsWith("S-") ? "scenario" : "decision",
			id: match[1],
		})),
	);
