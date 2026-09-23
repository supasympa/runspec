# runspec

Prompts in, types out. The spec that runs.

runspec is a small command-line tool that turns the loop described in [Prompts in, types out](https://lewisbarclay.com/blog/prompts-in-types-out) into a process any coding agent can follow. Nobody writes a spec document. The spec is four artefacts the loop produces, and `runspec check` makes them run.

## Why

Spec-driven development kept the discipline of writing things down but kept the wrong artefact: prose. Prose can't be run, so nobody can prove the code matches it, and the tests generated from the same prose are the machine marking its own homework.

runspec changes the artefact, not the discipline:

- **Scenarios** are Given/Then examples in the stakeholder's own words. They approve them, so approving a scenario approves its test. No translation step to drift.
- **The model** is types for what exists and functions for what holds. The engineer checks it.
- **Tests** are generated from the scenarios, not from the model. Two independent witnesses. When they agree, the agreement means something.
- **Decisions** are numbered records of who decided what and why. The agent drafts them for free, so they actually get written.

Everything else, the implementation, the schema, the tickets, the governance documents, is generated output. Outputs are disposable. The spec isn't.

## The loop

1. **Interview.** The agent talks to the stakeholder about the business. Nothing is written down yet.
2. **Scenarios.** The agent drafts Given/Then examples. The stakeholder corrects and approves them. A scenario is one behaviour: if a draft needs more than a handful of Then steps, the interview splits it, and `runspec check` warns when a scenario has grown past five.
3. **Model.** The agent drafts types and rules. The engineer reviews.
4. **Decisions.** Every human correction becomes a numbered record, drafted by the agent, approved by the human.
5. **Tests.** One test per approved scenario, each carrying a `runspec: S-NN` marker. Assert exactly what the scenario says, nothing else.
6. **Everything else.** Generated from the model, sealed, and checked.

## A worked example

A clinic manager wants appointments. She talks to the agent:

> "Patients book appointments with a practitioner. Once a session starts, the list is fixed. No-shows are charged, sickness cancellations aren't."

The agent drafts scenarios. She corrects one and approves them:

```sh
runspec scenario add "sickness cancellation"
runspec scenario approve S-03 --by "S. Okafor"
```

`scenarios/S-03.md` now reads:

```markdown
# S-03: sickness cancellation

Status: approved
Approved by: S. Okafor
Approved hash: 8289d9988f0c26da4db8ad5bb256da589cefeb8ceb9c5ea08e88f007b33bb753

Given a patient cancels because of sickness
Then 1. the appointment is cancelled
 2. no charge is made
```

The agent drafts the model. She reads it and catches a rule: "can you really change an appointment after check-in? No." The agent records the correction before changing anything:

```sh
runspec decision add "Appointments cannot be changed after check-in" \
  --by "S. Okafor" --because "practitioners need a stable list once their session starts"
```

That's `decisions/D-001.md`, dated the day it was recorded, and it never gets deleted. If the rule changes later, a new decision supersedes it.

The agent generates one test per approved scenario:

```ts
// runspec: S-03
it("makes no charge", () => {
  expect(chargeable(cancelledForSickness)).toBe(false);
});
```

Before every commit, `runspec check` proves the chain: the test traces to an approved scenario, the scenario has a test, the decision exists, and no generated file was hand-edited.

Later, she asks the agent: "Can I change an appointment after check-in?" The answer points at evidence: no, rule D-001, decided by you on 22 September, and here's the test proving it. The agent can't just be reassuring.

## Install

Requires [Bun](https://bun.sh).

```sh
git clone https://github.com/supasympa/runspec.git
cd runspec && bun install
bun link
```

Or run it directly from a checkout: `bun /path/to/runspec/src/cli.ts check`.

## Commands

| Command | What it does |
| --- | --- |
| `runspec init` | Creates `scenarios/`, `decisions/`, `runspec.json`, `AGENTS.md` and six prompts in `commands/`. An existing `AGENTS.md` gets a runspec section added, not replaced |
| `runspec install <agent>` | Adapts the prompts for claude, cursor, gemini or codex |
| `runspec scenario add <title>` | Drafts the next S-NN scenario |
| `runspec scenario list` | Lists scenarios with status |
| `runspec scenario approve <id> --by <who>` | Approves a scenario and records a hash of its body. Approving it approves its test. |
| `runspec decision add <title> --by <who> --because <why> [--supersedes <id>]` | Records a dated D-NNN decision |
| `runspec decision list` | Lists decisions |
| `runspec seal` | Records hashes of generated files |
| `runspec check` | Verifies traceability and seals. Run before every commit. |
| `runspec status` | Counts of each artefact |

## Any language

runspec is written in TypeScript on Bun, but it makes no assumptions about your project's language. It never parses your code. It only looks for marker text inside files, and markers work in every comment syntax:

```ts
// runspec: S-03
```

```python
# runspec: S-03
```

```sql
-- runspec: S-03
```

Point `testGlobs` at your tests and `generatedGlobs` at files your agent generates, in `runspec.json`:

```json
{
  "testGlobs": ["tests/**"],
  "generatedGlobs": ["src/gen/**"]
}
```

The folders default to `scenarios/`, `decisions/` and `commands/` at the project root. A project that already keeps its records somewhere can say where, as paths inside the project. Write `runspec.json` before `runspec init` and init uses them:

```json
{
  "testGlobs": ["tests/**"],
  "generatedGlobs": [],
  "scenariosDir": "docs/scenarios",
  "decisionsDir": "docs/adr",
  "commandsDir": "docs/runspec"
}
```

## Any agent

The process lives in `AGENTS.md`, the convention most coding agents already read, plus six prompts in `commands/` as plain markdown: `interview`, `scenario`, `model`, `tests`, `decide`, `ask`. Any agent that can read a repository can follow them.

`runspec install <agent>` adapts the files for a specific agent's native format:

| Agent | What install does |
| --- | --- |
| claude | `CLAUDE.md` (or a runspec section added to an existing one) plus the six prompts in `.claude/commands/` with slash-command frontmatter |
| cursor | `.cursor/rules/runspec.mdc` |
| gemini | `GEMINI.md` |
| codex | Nothing. `AGENTS.md` is native. |

The generic files are the source of truth. Installs are copies, so there's nothing to drift.

## Enforcement

`runspec check` fails on:

- a test referencing a missing, unapproved or superseded scenario
- an approved scenario with no test
- an approved scenario whose text has changed since it was approved
- a reference to a missing decision, or to one that has been superseded
- a decision that supersedes one that does not exist
- two files claiming the same id, or a file not named after its id
- a generated file that differs from its sealed hash, which means someone hand-edited it
- a generated file that has never been sealed

The approval hash and the seal are the point of the tool. An approved scenario is a promise the stakeholder made, so if its words change, the promise has to be made again: `runspec scenario approve` records the new hash. Generated files are outputs: if someone edits one directly, it quietly becomes the source of truth and the model drifts from reality. The only way past a failed seal is to change the model, regenerate, then `runspec seal`.

## What check can and can't prove

`runspec check` proves the records link up and haven't changed since they were approved or sealed. It can't prove who approved them. `Approved by:` is a line of text, and anyone with write access, an agent included, can write it and run `runspec scenario approve` or `runspec seal` themselves.

So the guarantee comes from review, not from the tool. Treat a change to the scenarios folder, the decisions folder or `.runspec/seals.json` as a request for the stakeholder's sign-off: require their review on those paths, for example with a `CODEOWNERS` entry. A diff that re-approves a scenario or re-seals a file is exactly the diff somebody should read.

It also doesn't check that a test asserts what its scenario says. The marker says which scenario a test is for; whether it tests it is for the reviewer.

## What runspec is not

It doesn't run your tests, generate your code, or talk to your agent. It holds the artefacts, enforces the traceability between them, and refuses to let the loop be skipped. All the intelligence stays with the agent and the humans approving things. That's deliberate: a dumb gate is one you can actually trust.
