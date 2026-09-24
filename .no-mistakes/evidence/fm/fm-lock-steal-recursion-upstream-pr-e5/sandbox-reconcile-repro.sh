#!/usr/bin/env bash
# Usage: sandbox-reconcile-repro.sh <bin-dir> <label>
# Registers a procevent source, then runs `fm-procevent.sh reconcile` inside a
# macOS Seatbelt profile that denies writes to the claim root (what a sandboxed
# harness such as Codex workspace-write does to paths outside its workspace).
BIN=$1 LABEL=$2
W=$(mktemp -d /tmp/fm-repro.XXXX); W=$(cd "$W" && pwd -P)
H="$W/home"; mkdir -p "$H/state"; CL="$W/claims"
cat > "$W/stub.sh" <<'S'
#!/usr/bin/env bash
sleep 30
S
chmod +x "$W/stub.sh"
FM_HOME="$H" FM_PROCEVENT_CLAIM_ROOT="$CL" "$BIN/fm-procevent.sh" register lavish repro-src -- "$W/stub.sh" >/dev/null || { echo "register failed"; exit 2; }
PROFILE="(version 1)(allow default)(deny file-write* (subpath \"$CL\"))"
echo "== [$LABEL] sandbox-exec (deny writes under $CL) fm-procevent.sh reconcile, 30s limit"
start=$SECONDS
sandbox-exec -p "$PROFILE" env FM_HOME="$H" FM_PROCEVENT_CLAIM_ROOT="$CL" \
  "$BIN/fm-procevent.sh" reconcile >"$W/out" 2>"$W/err" &
pid=$!
while kill -0 $pid 2>/dev/null && [ $((SECONDS-start)) -lt 30 ]; do sleep 0.2; done
if kill -0 $pid 2>/dev/null; then
  kill -KILL $pid; wait $pid 2>/dev/null
  echo "RESULT: HUNG - reconcile still running after 30s, killed"
else
  wait $pid; rc=$?
  echo "RESULT: exited rc=$rc after $((SECONDS-start))s"
fi
echo "-- stdout:"; head -c 400 "$W/out"; echo
echo "-- stderr (first 5 lines, $(wc -l <"$W/err" | tr -d ' ') total):"; head -5 "$W/err" | cut -c1-200
echo "-- .steal artifacts under claim root: $(find "$CL" -name '*.steal*' 2>/dev/null | wc -l | tr -d ' ')"
pkill -f "$W/stub.sh" 2>/dev/null; rm -rf "$W"
