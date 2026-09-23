import type { RunspecDirs } from "./agent-md.js";

export type CommandSpec = { description: string; body: string };

export const commandSpecs = (
	dirs: RunspecDirs,
): Record<string, CommandSpec> => ({
	interview: {
		description: "Interview the stakeholder and draft scenarios",
		body: `Talk with me about the business area we are modelling. Ask one question at a time: what exists, what can happen, what must hold. Surface the awkward cases nobody mentions. Do not write any document.

A scenario is one behaviour. If a draft needs more than a handful of Then steps, split it into two scenarios. If the conversation starts spanning two different jobs, say so and propose splitting the work into separate interviews before drafting anything.

When a behaviour is clear, run \`runspec scenario add "<short title>"\` and write the Given/Then body into the file it names, in my words. One behaviour per scenario, numbered Then steps.

End by listing every draft awaiting my approval, and remind me that approving a scenario approves its test.
`,
	},
	scenario: {
		description: "Draft or amend a scenario",
		body: `$ARGUMENTS

Draft or amend that scenario. Use \`runspec scenario add "<title>"\` for a new one, or edit the existing file under ${dirs.scenariosDir}/. Given/Then in the stakeholder's words, one behaviour per scenario, numbered Then steps. Never invent a rule the stakeholder has not stated. Changing an approved scenario withdraws its approval: \`runspec check\` fails until the stakeholder approves it again. If something is unclear, ask me before writing.
`,
	},
	model: {
		description: "Draft the domain model from approved scenarios",
		body: `Draft or update the domain model from the approved scenarios in ${dirs.scenariosDir}/ and our conversation. Types for what exists, functions for what holds. Keep the model free of framework and I/O concerns.

When I correct you, record the correction first with \`runspec decision add "<the rule>" --by "<me>" --because "<reason>"\`, then change the model.
`,
	},
	tests: {
		description: "Generate tests from approved scenarios",
		body: `Generate one test per approved scenario. Each test file or block carries a \`runspec: S-NN\` marker comment in this project's comment syntax. Assert exactly what the scenario says and nothing else. Do not write tests for unapproved scenarios.

Run \`runspec check\` when done and fix everything it flags.
`,
	},
	decide: {
		description: "Record a decision",
		body: `$ARGUMENTS

Record this as a decision: \`runspec decision add "<the rule>" --by "<who>" --because "<why>"\`. If it replaces an earlier decision, add \`--supersedes D-NNN\`. Decisions are never deleted, only superseded.
`,
	},
	ask: {
		description: "Answer a stakeholder question from the spec",
		body: `$ARGUMENTS

Answer this question by pointing at evidence: the scenario (S-NN), the rule in the model, the test that proves it, or the decision (D-NNN) with who decided and why. Quote the relevant lines.

If nothing in the spec answers it, say so plainly and propose the scenario or decision that would.
`,
	},
});
