# Test evidence: captain-facing ASD-STE100 writing skill

Change under test: `ccf76764` adds the `captain-facing-writing` agent skill and
wires it into `AGENTS.md` section 9, the agent-skill trigger index, the bearings
(Lavish board) skill, and the documentation audience inventory.

The skill is a prompt/instruction surface. Its behavioural effect (an agent
actually writing in Simplified Technical English) is model interpretation,
which the repo's test-quality policy treats as development-only evaluation, not
live-LLM validation. The checks below drive the deterministic integration
surfaces that this change actually alters.

## Deterministic checks (passed)

- `bin/fm-doc-audience-check.sh` -> `ok surfaces=118 local_links=717`
  (the new prose surface is classified exactly once and all local links resolve).
- `tests/fm-documentation-audiences.test.sh` -> all 4 cases ok.
- `bin/fm-test-run.sh --list --changed --base 65e2aa44...` -> 43 mapped test
  paths, rc=0 (no `__unmapped__` failure for the changed instruction paths).
- Skill registration contract: `.claude/skills/captain-facing-writing/SKILL.md`
  resolves through the committed `../.agents/skills` symlink; frontmatter parses
  (PyYAML), `name` matches the directory, and the description declares a
  "Load before ..." trigger covering chat replies, escalations, decision
  requests, status digests, and Lavish board copy.

## Not driven live

- Whether a real primary writes captain-facing text in ASD-STE100, and whether
  Lavish board copy follows the standard, could not be validated here: the only
  measurement is model interpretation, and a token-spending live harness check is
  opt-in (no `FM_LIVE`/guard opt-in was present in this run). No captain opt-in
  for a prompt-submitting live check was supplied.
