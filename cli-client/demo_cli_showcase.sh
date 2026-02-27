#!/usr/bin/env bash
set -euo pipefail

STEP=1

if command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
else
  echo "Error: python/python3 not found in PATH."
  exit 1
fi

CLI=("$PYTHON_BIN" "se2525")
SOURCE_CSV="../back-end/data/points.csv"

# S1=now+30m, E1=S1+40m, S2=E1+1m, E2=S2+40m
PY_CODE='from datetime import datetime, timedelta; now=datetime.now().replace(second=0,microsecond=0); s1dt=now+timedelta(minutes=30); e1dt=s1dt+timedelta(minutes=40); s2dt=e1dt+timedelta(minutes=1); e2dt=s2dt+timedelta(minutes=40); fmt=lambda d: d.strftime("%Y-%m-%d %H:%M"); day=lambda d: d.strftime("%Y%m%d"); print(fmt(s1dt)); print(fmt(e1dt)); print(fmt(s2dt)); print(fmt(e2dt)); print(day(s1dt)); print(day(e1dt)); print(day(e2dt))'

if ! TIME_OUTPUT=$("$PYTHON_BIN" -c "$PY_CODE"); then
  echo "Error: failed to generate timestamps with $PYTHON_BIN"
  exit 1
fi

# Strip CR on Windows and split lines safely.
TIME_OUTPUT=$(printf '%s' "$TIME_OUTPUT" | tr -d '\r')
mapfile -t TIME_VALUES <<< "$TIME_OUTPUT"

if [[ ${#TIME_VALUES[@]} -lt 7 ]]; then
  echo "Error: could not parse generated timestamps."
  echo "Raw output was:"
  printf '%s\n' "$TIME_OUTPUT"
  exit 1
fi

S1="${TIME_VALUES[0]}"
E1="${TIME_VALUES[1]}"
S2="${TIME_VALUES[2]}"
E2="${TIME_VALUES[3]}"
S1_DAY="${TIME_VALUES[4]}"
E1_DAY="${TIME_VALUES[5]}"
E2_DAY="${TIME_VALUES[6]}"

pause_step() {
  read -n 1 -s -r -p "Press any key to continue..."
  echo
}

run_step() {
  local label="$1"
  shift

  echo
  echo "[$STEP] $label"
  echo "Command: $*"
  pause_step

  "$@"
  STEP=$((STEP + 1))
}

if [[ ! -f "$SOURCE_CSV" ]]; then
  echo "Error: CSV file not found at $SOURCE_CSV"
  exit 1
fi

read -r -p "Enter point id X to use in all steps: " X
if [[ ! "$X" =~ ^[0-9]+$ ]] || [[ "$X" -le 0 ]]; then
  echo "Error: X must be a positive integer."
  exit 1
fi

echo "Using X=$X"
echo "S1=$S1, E1=$E1, S2=$S2, E2=$E2"
echo "Date windows (YYYYMMDD): S1=$S1_DAY, E1=$E1_DAY, E2=$E2_DAY"

echo
pause_step

run_step "healthcheck" "${CLI[@]}" healthcheck
run_step "resetpoints" "${CLI[@]}" resetpoints
run_step "addpoints" "${CLI[@]}" addpoints --source "$SOURCE_CSV"
run_step "healthcheck" "${CLI[@]}" healthcheck

run_step "points --status available" "${CLI[@]}" points --status available
run_step "points --status charging" "${CLI[@]}" points --status charging
run_step "points --status offline" "${CLI[@]}" points --status offline

run_step "point --id X" "${CLI[@]}" point --id "$X"
run_step "reserve --id X" "${CLI[@]}" reserve --id "$X"
run_step "points --status reserved" "${CLI[@]}" points --status reserved

run_step "point --id X" "${CLI[@]}" point --id "$X"
run_step "updpoint --id X --status available" "${CLI[@]}" updpoint --id "$X" --status available
run_step "point --id X" "${CLI[@]}" point --id "$X"

run_step "reserve --id X" "${CLI[@]}" reserve --id "$X"
run_step "points --status reserved" "${CLI[@]}" points --status reserved

run_step "newsession #1" "${CLI[@]}" newsession --id "$X" --starttime "$S1" --endtime "$E1" --startsoc 10 --endsoc 30 --totalkwh 15 --kwhprice 0.5 --amount 7.5
run_step "pointstatus --id X --from S1 --to E1" "${CLI[@]}" pointstatus --id "$X" --from "$S1_DAY" --to "$E1_DAY"
run_step "point --id X" "${CLI[@]}" point --id "$X"

run_step "newsession #2" "${CLI[@]}" newsession --id "$X" --starttime "$S2" --endtime "$E2" --startsoc 50 --endsoc 80 --totalkwh 20 --kwhprice 0.6 --amount 12
run_step "sessions --id X --from S1 --to E2" "${CLI[@]}" sessions --id "$X" --from "$S1_DAY" --to "$E2_DAY"
run_step "pointstatus --id X --from S1 --to E2" "${CLI[@]}" pointstatus --id "$X" --from "$S1_DAY" --to "$E2_DAY"

echo
echo "Demo sequence completed."