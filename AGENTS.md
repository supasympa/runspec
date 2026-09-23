# runspec

How work in this folder is done. This file is read on every turn, so
keep it short and keep it true.

- Write the failing test first, then the code that makes it pass.
- Every file under 250 lines, every function under 25.
- Zero runtime dependencies. Node and Bun built-ins only.
- `src/domain/` is pure: no fs, no Bun, no console. Side effects live in `src/adapters/` and `src/commands/`.
- Run `bun test`, `bun run build` (tsc) and `bun run lint` (biome) before saying something works.
- No em dashes in anything the user reads.
