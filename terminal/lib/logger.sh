#!/bin/bash
# Logging Utilities
# Functions for structured logging with timestamps and levels

# Log levels
export LOG_LEVEL_DEBUG=0
export LOG_LEVEL_INFO=1
export LOG_LEVEL_WARN=2
export LOG_LEVEL_ERROR=3

# Current log level (default: INFO)
export CURRENT_LOG_LEVEL=${CURRENT_LOG_LEVEL:-$LOG_LEVEL_INFO}

# Log file (optional)
export LOG_FILE="${LOG_FILE:-}"

# Internal logging function
_log() {
  local level="$1"
  local level_num="$2"
  local color="$3"
  shift 3
  local message="$*"
  
  # Check if we should log this level
  if [ "$level_num" -lt "$CURRENT_LOG_LEVEL" ]; then
    return
  fi
  
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local log_line="[$timestamp] [$level] $message"
  
  # Print to console with color
  echo -e "${color}${log_line}\033[0m"
  
  # Write to log file if configured
  if [ -n "$LOG_FILE" ]; then
    echo "$log_line" >> "$LOG_FILE"
  fi
}

# Public logging functions
log_debug() {
  _log "DEBUG" "$LOG_LEVEL_DEBUG" "\033[0;36m" "$@"
}

log_info() {
  _log "INFO" "$LOG_LEVEL_INFO" "\033[0;37m" "$@"
}

log_warn() {
  _log "WARN" "$LOG_LEVEL_WARN" "\033[1;33m" "$@"
}

log_error() {
  _log "ERROR" "$LOG_LEVEL_ERROR" "\033[1;31m" "$@"
}

log_success() {
  _log "SUCCESS" "$LOG_LEVEL_INFO" "\033[1;32m" "$@"
}

# Set log level
# Usage: set_log_level debug|info|warn|error
set_log_level() {
  case "$1" in
    debug)
      export CURRENT_LOG_LEVEL=$LOG_LEVEL_DEBUG
      ;;
    info)
      export CURRENT_LOG_LEVEL=$LOG_LEVEL_INFO
      ;;
    warn)
      export CURRENT_LOG_LEVEL=$LOG_LEVEL_WARN
      ;;
    error)
      export CURRENT_LOG_LEVEL=$LOG_LEVEL_ERROR
      ;;
    *)
      log_error "Invalid log level: $1"
      return 1
      ;;
  esac
}

# Set log file
# Usage: set_log_file /path/to/file.log
set_log_file() {
  export LOG_FILE="$1"
  log_info "Logging to file: $LOG_FILE"
}
