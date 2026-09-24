#!/usr/bin/env bash
# Reproduce: watcher's inline `fm-procevent.sh reconcile` under a harness sandbox
# (macOS Seatbelt, the mechanism Codex's workspace-write profile uses) that denies
# writes to the machine-wide claim root outside the workspace, while FM_HOME stays
# writable. No chmod on the parent: the root is an ordinary 0700 dir owned by us.
# usage: repro-seatbelt-sandbox.sh <firstmate-tree> <label>
set -u
tree=$1 label=$2
T=$(mktemp -d /tmp/fmrepro-run.XXXX); T=$(cd "$T" && pwd -P)
home="$T/fm-home"; claims="$T/home/.local/state/firstmate/procevent-claims"
mkdir -p "$home/state" "$claims"; chmod 700 "$claims"
stub="$T/stub.sh"; printf '#!/bin/sh\nwhile [ ! -e "$1" ]; do sleep 1; done\n' > "$stub"; chmod +x "$stub"
FM_HOME="$home" FM_PROCEVENT_CLAIM_ROOT="$claims" "$tree/bin/fm-procevent.sh" register lavish repro-src -- "$stub" "$T/never" >/dev/null
echo "[$label] claim root mode: $(stat -f %Sp "$claims") (writable by owner outside the sandbox)"
profile="(version 1)(allow default)(deny file-write* (subpath \"$claims\"))"
echo "[$label] sandbox probe: $(sandbox-exec -p "$profile" mkdir "$claims/probe" 2>&1 || true)"
start=$SECONDS
sandbox-exec -p "$profile" env FM_HOME="$home" FM_PROCEVENT_CLAIM_ROOT="$claims" \
  "$tree/bin/fm-procevent.sh" reconcile >"$T/out" 2>"$T/err" &
pid=$!
while kill -0 $pid 2>/dev/null && [ $((SECONDS-start)) -lt 30 ]; do sleep 0.2; done
if kill -0 $pid 2>/dev/null; then
  pkill -KILL -P $pid 2>/dev/null; kill -KILL $pid 2>/dev/null; wait $pid 2>/dev/null
  echo "[$label] RESULT: reconcile still running after 30s -> killed (watcher would be wedged)"
else
  wait $pid; rc=$?
  echo "[$label] RESULT: reconcile exited rc=$rc after $((SECONDS-start))s"
fi
echo "[$label] stdout: $(head -c 200 "$T/out")"
echo "[$label] stderr (first 3 lines, $(wc -l <"$T/err" | tr -d ' ') total):"; head -3 "$T/err" | cut -c1-240
echo "[$label] .steal artifacts under claim root: $(find "$claims" -name '*.steal*' 2>/dev/null | wc -l | tr -d ' ')"
FM_HOME="$home" "$tree/bin/fm-procevent.sh" stop-all >/dev/null 2>&1 || true
rm -rf "$T"
