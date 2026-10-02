# Round 2 targeted validation: captain-facing-writing

## Change

Added a "Worked examples" section to
`.agents/skills/captain-facing-writing/SKILL.md` with three examples:

- Example A: a captain-facing final reply for a completed deliverable.
- Example B: a Lavish board card set (title, about, decide, option labels and hints).
- Example C: an unsolicited security warning no captain asked for.

The examples contain no internal fleet terms (checked against the
`AGENTS.md` section 9 forbidden vocabulary).

## Live drive

Command (bounded, non-interactive, read-only tool, no `--yes`):

```
pi --no-session --no-extensions --provider deepseek --model deepseek-flash \
   --tools read -p '<read the skill, then write scenarios A/B/C>'
```

The prompt directed the agent to read
`.agents/skills/captain-facing-writing/SKILL.md` before writing.
Raw output: `live-captain-facing-examples.txt`.

Result: all three scenarios produced output that follows the standard
(one idea per sentence, active voice, simple words, no idiom, no internal
terms, one term per concept on the board card). The three worked examples
in the skill are these driven outputs.

After adding the examples, the live drive was re-run against the updated
skill for the adversarial warning and a board card. Both stayed in the
standard. Raw output: `live-captain-facing-rerun.txt`.

## Deterministic checks

- `bin/fm-doc-audience-check.sh` -> `ok surfaces=118 local_links=717`.
- `tests/fm-documentation-audiences.test.sh` -> 4/4 ok.
- `bin/fm-test-run.sh --list --changed --base 65e2aa44...` -> 43 mapped
  tests, rc=0, no `__unmapped__`.

Outputs: `round2-targeted-checks.txt`, `round2-test-selection.txt`.

## Note

This is development-only live evaluation of prompt-following behavior,
not a deterministic CI test, per the repository test-quality rule.
