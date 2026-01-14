#!/bin/bash

# Auto-save script for winsights bot
# Automatically commits and pushes changes to GitHub

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.autosave.pid"
LOG_FILE="$SCRIPT_DIR/.autosave.log"

start_autosave() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "Auto-save is already running (PID: $PID)"
            return 1
        else
            rm "$PID_FILE"
        fi
    fi

    echo "Starting auto-save..."
    cd "$SCRIPT_DIR"
    
    # Start the Python watcher in the background
    nohup python3 "$SCRIPT_DIR/autosave_watcher.py" >> "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    echo "Auto-save started (PID: $(cat $PID_FILE))"
    echo "Logs: $LOG_FILE"
}

stop_autosave() {
    if [ ! -f "$PID_FILE" ]; then
        echo "Auto-save is not running"
        return 1
    fi

    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        kill "$PID"
        rm "$PID_FILE"
        echo "Auto-save stopped"
    else
        echo "Auto-save process not found"
        rm "$PID_FILE"
    fi
}

status_autosave() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "Auto-save is running (PID: $PID)"
        else
            echo "Auto-save is not running (stale PID file)"
            rm "$PID_FILE"
        fi
    else
        echo "Auto-save is not running"
    fi
}

case "$1" in
    start)
        start_autosave
        ;;
    stop)
        stop_autosave
        ;;
    status)
        status_autosave
        ;;
    restart)
        stop_autosave
        sleep 1
        start_autosave
        ;;
    *)
        echo "Usage: $0 {start|stop|status|restart}"
        exit 1
        ;;
esac

