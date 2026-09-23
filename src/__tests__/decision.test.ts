import { describe, expect, test } from "bun:test";
import {
	formatDecision,
	nextDecisionId,
	parseDecision,
} from "../domain/decision.js";

const example = `# D-001: Appointments cannot be changed after check-in

Decided by: S. Okafor, 22 Sep 2026
Because: practitioners need a stable list once their session starts.`;

describe("parseDecision", () => {
	test("parses a decision", () => {
		const parsed = parseDecision(example);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) {
			return;
		}
		expect(parsed.value.id).toBe("D-001");
		expect(parsed.value.title).toBe(
			"Appointments cannot be changed after check-in",
		);
		expect(parsed.value.decidedBy).toBe("S. Okafor, 22 Sep 2026");
		expect(parsed.value.because).toBe(
			"practitioners need a stable list once their session starts.",
		);
		expect(parsed.value.supersedes).toBeNull();
	});

	test("round trips through format", () => {
		const parsed = parseDecision(example);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) {
			return;
		}
		expect(parseDecision(formatDecision(parsed.value))).toEqual(parsed);
	});

	test("rejects a missing Because line", () => {
		const broken = "# D-001: rule\n\nDecided by: someone";
		expect(parseDecision(broken).ok).toBe(false);
	});
});

describe("nextDecisionId", () => {
	test("starts at D-001 and continues", () => {
		expect(nextDecisionId([])).toBe("D-001");
		expect(nextDecisionId(["D-001", "D-002"])).toBe("D-003");
	});
});
