# Round 3 live validation: captain-facing-writing (ASD-STE100)

Change under test (base 65e2aa44 -> target 208caf87):
- `ccf76764` adds the `captain-facing-writing` agent skill and wires it into
  `AGENTS.md` section 9, `.agents/skills/bearings/SKILL.md` (Lavish board copy),
  the agent-skill trigger index, and `docs/documentation-audiences.json`.
- `208caf87` adds a `## Worked examples` section (Examples A, B, C) to the skill.

The user intent: "Always use ASD-STE100 (Simplified Technical English) when
something needs the captain's attention. The same standard applies on Lavish
boards."

## What was driven live

Two real product surfaces, both in this run:

1. Headless pi agent sessions in the worktree, with `--approve` so project
   skills are advertised exactly as a firstmate primary sees them. The agent
   auto-loaded `captain-facing-writing` (visible in the tool results) for the
   deliverable and warning scenarios, and loaded both `lavish` and
   `captain-facing-writing` for the board scenario. Raw streams are the
   `scenario*.raw.json` files here; `scenario-outputs.txt` extracts the loads
   and the final text.
2. A real pi primary in a disposable `fm-lab-*` lab, launched per the runbook
   with `bin/fm-lab-home.sh create` and a private `TMUX_TMPDIR` socket. The
   primary's startup panel advertised `captain-facing-writing`, and the pane
   capture shows `[skill] captain-facing-writing:1-200` load before it wrote.
   See `primary-transcript.txt`.

Model: `deepseek-v4-pro` (pi provider `deepseek`). Claude and the OpenAI Codex
provider were both rate-limited on this machine (`You've hit your weekly limit`,
`Codex error: The usage limit has been reached`), so they could not be driven.

## Scenario A - final reply for a completed deliverable

Auto-loaded skill; final text:

```
Captain, the billing CSV export is complete.
The change is ready for your review at https://example.com/pull/77.
All its checks passed.
Do you want me to merge this pull request?
```

Check: one idea per sentence; each sentence under the length bound; active
voice; simple familiar words ("complete", "ready", "checks passed"); no idiom;
no internal fleet terms; direct question to the captain. PASS.

## Scenario B - Lavish board card copy

Auto-loaded `lavish` and `captain-facing-writing`; final text:

```
Card title: Choose when to ship the billing CSV export

About: The billing CSV export is ready to ship. It can go in the current
release or wait for the next one.

Decide: Do you want to ship the billing CSV export now, or hold it for the next
release?

Option label: Ship it now
Option hint: This choice puts the billing CSV export in the current release.

Option label: Hold it for the next release
Option hint: This choice keeps the billing CSV export out of the current release
until the next one.
```

Check: short card title; `about` and `decide` lines are short sentences;
option labels are short outcome names; option hints are one sentence each and
state what the choice does; one term per concept ("billing CSV export",
"current release"). One minor drift: the last hint says "the next one" where the
rest of the board says "next release". Rated PASS with that nit.

The forced `/skill:captain-facing-writing` run is cleaner on terminology and
uses "live product" consistently (see `scenario-outputs.txt`).

## Scenario C - unsolicited warning (adversarial)

Auto-loaded skill; final text:

```
Captain, I found a security problem during routine work on the billing project.

The billing service returns every customer's saved card number to any logged-in
user. An attacker only needs an account. The attacker can then read every
customer's full card number. Every customer who saved a card is at risk now.

The flaw is in the live product. I have not changed anything.

Do you want me to stop other work and fix this now, or do you want a written
report first?
```

Check: this message was not requested by a captain decision, yet it still
follows the standard - one idea per sentence, active voice, plain words, no
idiom, and a direct choice. The real primary's independent warning reply
(`primary-transcript.txt`) is the same shape. PASS.

## Boundary of the evidence

`deepseek-flash` (a weaker model on the same provider, with the skill
advertised) did NOT load the skill and wrote non-STE text, for example:

```
Captain, the billing CSV export work is finished. The change is up as PR #77,
and all its checks are green: ... Nothing is blocking it - it just needs your
call on whether to merge. Want me to go ahead?
```

The skill mechanism is model-discretionary: the change advertises the standard
and instructs the agent to load it, and a capable model follows that. There is
no deterministic enforcement, so a weak model can skip the load. This is a
model-capability caveat, not a regression in the change.

## Deterministic supporting checks

`bin/fm-doc-audience-check.sh` -> `ok surfaces=118 local_links=717`.
`tests/fm-documentation-audiences.test.sh` -> 4/4 ok.

Output: `deterministic-checks.txt`.
