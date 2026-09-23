import { describe, expect, test } from "bun:test";
import { findMarkers } from "../domain/traceability.js";

describe("findMarkers", () => {
	test("finds markers in any comment syntax", () => {
		const markers = findMarkers([
			{ path: "tests/s03.test.ts", content: "// runspec: S-03\nexpect(1)" },
			{ path: "tests/test_s04.py", content: "# runspec: S-04" },
			{ path: "src/gen/x.go", content: "-- runspec: D-001" },
		]);
		expect(markers).toEqual([
			{ file: "tests/s03.test.ts", kind: "scenario", id: "S-03" },
			{ file: "tests/test_s04.py", kind: "scenario", id: "S-04" },
			{ file: "src/gen/x.go", kind: "decision", id: "D-001" },
		]);
	});

	test("ignores prose that mentions runspec without a marker", () => {
		const markers = findMarkers([
			{ path: "README.md", content: "run runspec check before every commit" },
		]);
		expect(markers).toEqual([]);
	});
});
