# runspec

Prompts in, types out. The spec that runs.

runspec is a thin process layer for the loop described in [Prompts in, types out](https://lewisbarclay.com/blog/prompts-in-types-out). Nobody writes a spec. The spec is the scenarios, the model, the tests and the decisions log, and it runs.

## The loop

1. Interview the stakeholder. Write nothing.
2. Draft scenarios. The stakeholder corrects and approves them.
3. Draft the model: types for what exists, functions for what holds.
4. Every correction becomes a numbered decision record.
5. One test per approved scenario, marked `runspec: S-NN`.
6. Everything else is generated. `runspec check` enforces it.

## Install

Requires [Bun](https://bun.sh).

```sh
git clone https://github.com/lewisbarclay/runspec.git
cd runspec && bun install
bun link
```

Or run it directly from a checkout: `bun /path/to/runspec/src/cli.ts check`.

## Commands

| Command | What it does |
| --- | --- |
| `runspec init` | Creates `scenarios/`, `decisions/`, `runspec.json`, `CLAUDE.md` and six Claude slash commands |
| `runspec scenario add <title>` | Drafts the next S-NN scenario |
| `runspec scenario list` | Lists scenarios with status |
| `runspec scenario approve <id> --by <who>` | Approves a scenario. Approving it approves its test. |
| `runspec decision add <title> --by <who> --because <why> [--supersedes <id>]` | Records a D-NNN decision |
| `runspec decision list` | Lists decisions |
| `runspec seal` | Records hashes of generated files |
| `runspec check` | Verifies traceability and seals. Run before every commit. |
| `runspec status` | Counts of each artefact |

## Any language

runspec is written in TypeScript on Bun, but it makes no assumptions about your project's language. Scenarios and decisions are markdown. Traceability uses marker comments, which work in every comment syntax:

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

## Enforcement

`runspec check` fails on:

- a test referencing a missing or unapproved scenario
- an approved scenario with no test
- a reference to a missing decision
- a generated file that differs from its sealed hash (a hand edit)

After a legitimate regeneration, run `runspec seal` to record fresh hashes.

## Claude

`runspec init` writes `CLAUDE.md` and six slash commands into `.claude/commands/`: `/interview`, `/scenario`, `/model`, `/tests`, `/decide`, `/ask`. Works with Claude Code out of the box. `AGENTS.md` points other agents at the same process.
