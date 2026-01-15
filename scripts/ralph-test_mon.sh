#!/bin/bash
# Ralph Monitor - Checks Ralph health, restarts if stuck
# Learns from actual completion times to improve estimates

CHECK_INTERVAL=${1:-5}
PROJECT_DIR="/home/stefan/projects/Cerebro"
SCRIPT_DIR="$PROJECT_DIR/scripts"
LOG_FILE="$SCRIPT_DIR/ralph-monitor.log"
TIMING_FILE="$SCRIPT_DIR/ralph-timing.json"
RALPH_SCRIPT="./scripts/ralph.sh"
RALPH_ITERATIONS=30

cd "$PROJECT_DIR" || exit 1

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

notify() {
  notify-send "Ralph Monitor" "$1" 2>/dev/null || true
  log "NOTIFY: $1"
}

get_file_age_minutes() {
  local file=$1
  if [ -f "$file" ]; then
    local mod_time=$(stat -c %Y "$file")
    local now=$(date +%s)
    echo $(( (now - mod_time) / 60 ))
  else
    echo 9999
  fi
}

get_ai_pid() {
  pgrep -f "claude.*dangerously.*Ralph" 2>/dev/null | head -1 || \
  pgrep -f "opencode --prompt.*Ralph" 2>/dev/null | head -1 || \
  pgrep -f "amp.*Ralph" 2>/dev/null | head -1
}

get_ai_cpu() {
  local pid=$(get_ai_pid)
  if [ -n "$pid" ]; then
    ps -p "$pid" -o pcpu --no-headers 2>/dev/null | tr -d ' '
  else
    echo "0"
  fi
}

get_recent_src_changes() {
  find "$PROJECT_DIR/src" -type f -mmin -10 2>/dev/null | wc -l
}

# 4-Stage Health Check
# Stage 1: Ralph session exists with AI process
# Stage 2: AI process actively working (not idle in logs)
# Stage 3: Files being changed/created
# Stage 4: CPU under load

check_stage1_session() {
  tmux has-session -t ralph 2>/dev/null || return 1
  [ -n "$(get_ai_pid)" ] || return 1
  return 0
}

check_stage2_ai_active() {
  local pid=$(get_ai_pid)
  [ -z "$pid" ] && return 1

  if pgrep -f "opencode --prompt.*Ralph" >/dev/null; then
    local log_dir="$HOME/.local/share/opencode/log"
    local latest_log=$(ls -t "$log_dir"/*.log 2>/dev/null | head -1)
    if [ -n "$latest_log" ]; then
      local log_age=$(( ($(date +%s) - $(stat -c %Y "$latest_log")) / 60 ))
      if [ "$log_age" -gt 5 ] && tail -50 "$latest_log" 2>/dev/null | grep -q "session.idle\|exiting loop"; then
        return 1
      fi
    fi
  fi
  return 0
}

check_stage3_files_changing() {
  local recent=$(get_recent_src_changes)
  [ "$recent" -gt 0 ] && return 0

  local progress_age=$(get_file_age_minutes "progress.txt")
  local prd_age=$(get_file_age_minutes "prd.json")
  [ "$progress_age" -lt 10 ] || [ "$prd_age" -lt 10 ] && return 0

  return 1
}

check_stage4_cpu_active() {
  local cpu=$(get_ai_cpu)
  local cpu_int=${cpu%.*}
  [ "${cpu_int:-0}" -gt 2 ] && return 0
  return 1
}

get_health_status() {
  local s1="✗" s2="✗" s3="✗" s4="✗"
  check_stage1_session && s1="✓"
  check_stage2_ai_active && s2="✓"
  check_stage3_files_changing && s3="✓"
  check_stage4_cpu_active && s4="✓"
  echo "$s1$s2$s3$s4"
}

is_ralph_healthy() {
  check_stage1_session || return 1
  check_stage2_ai_active || return 1

  if ! check_stage3_files_changing && ! check_stage4_cpu_active; then
    return 1
  fi
  return 0
}

check_complete() {
  if [ -f "prd.json" ]; then
    local incomplete=$(grep -c '"passes": false' prd.json)
    if [ "$incomplete" -eq 0 ]; then
      return 0
    fi
  fi
  return 1
}

get_current_story() {
  if [ -f "prd.json" ] && command -v jq &>/dev/null; then
    jq -r '.stories[] | select(.passes == false) | .id' prd.json 2>/dev/null | head -1
  else
    echo "unknown"
  fi
}

init_timing_file() {
  if [ ! -f "$TIMING_FILE" ]; then
    echo '{"stories":{}}' > "$TIMING_FILE"
  fi
}

record_completion() {
  local story=$1
  local duration=$2
  local base_estimate=$(get_base_timeout "$story")
  local delta=$((duration - base_estimate))
  local delta_pct=$((delta * 100 / base_estimate))

  init_timing_file
  local tmp=$(mktemp)
  jq --arg s "$story" --argjson d "$duration" --argjson e "$base_estimate" \
    '.stories[$s] = {actual: $d, estimate: $e}' "$TIMING_FILE" > "$tmp" && mv "$tmp" "$TIMING_FILE"

  if [ $delta -lt 0 ]; then
    log "LEARNED: $story done in ${duration}m (estimate: ${base_estimate}m, ${delta_pct}% faster)"
  elif [ $delta -gt 0 ]; then
    log "LEARNED: $story done in ${duration}m (estimate: ${base_estimate}m, +${delta_pct}% slower)"
  else
    log "LEARNED: $story done in ${duration}m (estimate: ${base_estimate}m, exact)"
  fi
}

get_learned_timeout() {
  local story=$1
  if [ -f "$TIMING_FILE" ]; then
    local learned=$(jq -r --arg s "$story" '.stories[$s].actual // .stories[$s] // empty' "$TIMING_FILE" 2>/dev/null)
    if [ -n "$learned" ] && [ "$learned" != "null" ] && [ "$learned" != "" ]; then
      echo $(( learned + 15 ))
      return
    fi
  fi
  echo ""
}

get_base_timeout() {
  local story=$1

  # Heavy: AI agents, LLM integration, complex auth - 60 min
  if echo "$story" | grep -qE "^S(1\.3|1\.4|2\.5|3\.1|3\.4|3\.6|6\.2)$"; then
    echo 60; return
  fi

  # Complex: tRPC, dashboards, full CRUD pages, builder UI - 45 min
  if echo "$story" | grep -qE "^S(1\.5|2\.2|2\.3|4\.5|5\.3|5\.6|6\.3|6\.4|6\.5)$"; then
    echo 45; return
  fi

  # Medium: components, charts, settings pages - 30 min
  if echo "$story" | grep -qE "^S(1\.6|3\.[2357]|4\.[1-4,6-7]|5\.[1245]|7\.)"; then
    echo 30; return
  fi

  # Simple: schema, config, basic storage - 20 min
  echo 20
}

get_story_timeout() {
  local story=$1
  local learned=$(get_learned_timeout "$story")
  if [ -n "$learned" ]; then
    echo "$learned"
  else
    get_base_timeout "$story"
  fi
}

get_progress_summary() {
  if [ -f "prd.json" ]; then
    local total=$(grep -c '"passes":' prd.json)
    local done=$(grep -c '"passes": true' prd.json)
    echo "$done/$total stories"
  else
    echo "unknown"
  fi
}

restart_ralph() {
  log "Restarting Ralph..."
  tmux kill-session -t ralph 2>/dev/null || true
  sleep 2
  tmux new-session -d -s ralph -c "$PROJECT_DIR" "$RALPH_SCRIPT $RALPH_ITERATIONS"
  sleep 3
  if is_ralph_running; then
    log "Ralph restarted successfully"
    notify "Ralph restarted - was stuck"
  else
    log "ERROR: Failed to restart Ralph"
    notify "ERROR: Ralph failed to restart!"
  fi
}

init_timing_file

log "=========================================="
log "Ralph Monitor started (adaptive + learning)"
log "Check interval: ${CHECK_INTERVAL}m"
log "=========================================="

last_story=""
story_start_time=""

while true; do
  if check_complete; then
    notify "Ralph COMPLETE! All stories passing!"
    log "All stories complete. Monitor exiting."
    exit 0
  fi

  current_story=$(get_current_story)

  if [ "$current_story" != "$last_story" ] && [ -n "$last_story" ] && [ -n "$story_start_time" ]; then
    now=$(date +%s)
    duration=$(( (now - story_start_time) / 60 ))
    record_completion "$last_story" "$duration"
  fi

  if [ "$current_story" != "$last_story" ]; then
    story_start_time=$(date +%s)
    last_story="$current_story"
  fi

  max_stuck=$(get_story_timeout "$current_story")
  progress=$(get_progress_summary)
  progress_age=$(get_file_age_minutes "progress.txt")
  prd_age=$(get_file_age_minutes "prd.json")
  min_age=$((progress_age < prd_age ? progress_age : prd_age))

  timeout_source="base"
  if [ -f "$TIMING_FILE" ] && jq -e --arg s "$current_story" '.stories[$s]' "$TIMING_FILE" &>/dev/null; then
    timeout_source="learned"
  fi

  ai_cpu=$(get_ai_cpu)
  health=$(get_health_status)
  src_changes=$(get_recent_src_changes)

  if is_ralph_healthy; then
    log "[$health] $current_story ${min_age}m/${max_stuck}m, CPU:${ai_cpu}%, files:${src_changes}, $progress"
  elif check_stage1_session; then
    if ! check_stage2_ai_active; then
      log "[$health] IDLE: AI session not active on $current_story"
    elif ! check_stage3_files_changing && ! check_stage4_cpu_active; then
      log "[$health] STALLED: No files changing, CPU idle on $current_story"
    else
      log "[$health] DEGRADED: $current_story - partial health"
    fi

    if [ "$min_age" -gt 10 ]; then
      log "Restarting due to unhealthy state (${min_age}m without progress)"
      log "Progress: $progress"
      restart_ralph
      story_start_time=$(date +%s)
    fi
  else
    log "[$health] DEAD: Ralph not running (was on $current_story)"
    log "Progress: $progress"
    if ! check_complete; then
      restart_ralph
      story_start_time=$(date +%s)
    fi
  fi

  sleep $((CHECK_INTERVAL * 60))
done
