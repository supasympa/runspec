export const agentsMd = `# runspec: the spec that runs

This project uses runspec. The spec is not a document. It is four artefacts that run:

- \`scenarios/\`: Given/Then examples owned by the stakeholder. Approving a scenario approves its test.
- The model: types and rules in this codebase, owned by the engineer.
- Tests: one per approved scenario, each carrying a \`runspec: S-NN\` marker comment.
- \`decisions/\`: D-NNN records of who decided what and why. Append-only: superseded, never deleted.

## The loop

1. Interview the stakeholder about the business. Write nothing down yet.
2. Draft scenarios with \`runspec scenario add "<title>"\`. The stakeholder corrects and approves them.
3. Draft the model: types for what exists, functions for what holds.
4. Every human correction becomes \`runspec decision add "<rule>" --by "<who>" --because "<why>"\`.
5. Generate one test per approved scenario. Assert exactly what the scenario says, nothing else.
6. Everything else (implementation, schema, tickets, docs) is generated from the model.

## Hard rules

- A test may only assert what its approved scenario says.
- An unapproved scenario's test does not count.
- Files matched by \`generatedGlobs\` in \`runspec.json\` are outputs. Never hand-edit them. Change the model, regenerate, then \`runspec seal\`.
- \`runspec check\` must pass before every commit. It fails on tests without an approved scenario, approved scenarios without tests, unknown decision references, and hand-edited generated files.

## Commands for agents

Six prompts live in \`commands/\` as plain markdown: \`interview\`, \`scenario\`, \`model\`, \`tests\`, \`decide\`, \`ask\`. Read and follow the one that matches the task. \`runspec install claude|cursor|gemini\` copies them into the native format for those agents. Anything that reads this file needs no install.
`;

export const pointerMd = `This project uses runspec. Read AGENTS.md and follow the process described there. Run \`runspec check\` before every commit.
`;
