#!/usr/bin/env python3
"""
Auto-save watcher for winsights bot
Watches for file changes and automatically commits and pushes to GitHub
"""

import os
import sys
import time
import subprocess
import signal
from pathlib import Path
from datetime import datetime

# Configuration
REPO_DIR = Path(__file__).parent.absolute()
DEBOUNCE_SECONDS = 5  # Wait 5 seconds after last change before committing
CHECK_INTERVAL = 2  # Check every 2 seconds

running = True
last_change_time = 0
pending_changes = False

def signal_handler(sig, frame):
    global running
    print("Stopping auto-save watcher...")
    running = False
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def run_git_command(cmd):
    """Run a git command and return success status"""
    try:
        result = subprocess.run(
            cmd,
            cwd=REPO_DIR,
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", "Command timed out"
    except Exception as e:
        return False, "", str(e)

def has_changes():
    """Check if there are uncommitted changes"""
    success, stdout, _ = run_git_command(["git", "status", "--porcelain"])
    return success and stdout.strip() != ""

def commit_and_push():
    """Stage, commit, and push changes"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Auto-saving changes...")
    
    # Stage all changes
    success, _, stderr = run_git_command(["git", "add", "-A"])
    if not success:
        print(f"Error staging files: {stderr}")
        return False
    
    # Check if there are changes to commit
    if not has_changes():
        print("No changes to commit")
        return True
    
    # Create commit message with timestamp
    commit_msg = f"Auto-save: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    
    # Commit
    success, _, stderr = run_git_command(["git", "commit", "-m", commit_msg])
    if not success:
        print(f"Error committing: {stderr}")
        return False
    
    # Push to origin
    success, _, stderr = run_git_command(["git", "push", "origin", "main"])
    if not success:
        # Try with master if main doesn't exist
        success, _, stderr = run_git_command(["git", "push", "origin", "master"])
        if not success:
            print(f"Error pushing: {stderr}")
            return False
    
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Successfully auto-saved to GitHub")
    return True

def get_file_modification_times():
    """Get modification times of all tracked and untracked files"""
    times = {}
    
    # Get tracked files
    success, stdout, _ = run_git_command(["git", "ls-files"])
    if success:
        for line in stdout.strip().split('\n'):
            if line:
                file_path = REPO_DIR / line
                if file_path.exists():
                    times[str(file_path)] = file_path.stat().st_mtime
    
    # Get untracked files (excluding .git and other ignored files)
    for root, dirs, files in os.walk(REPO_DIR):
        # Skip .git directory
        if '.git' in dirs:
            dirs.remove('.git')
        
        for file in files:
            file_path = Path(root) / file
            rel_path = file_path.relative_to(REPO_DIR)
            
            # Skip if in .gitignore (basic check)
            if str(rel_path).startswith('.git') or str(rel_path) == '.autosave.pid':
                continue
            
            times[str(file_path)] = file_path.stat().st_mtime
    
    return times

def main():
    global pending_changes, last_change_time
    
    print(f"Auto-save watcher started for {REPO_DIR}")
    print(f"Watching for changes (debounce: {DEBOUNCE_SECONDS}s)...")
    
    last_file_times = get_file_modification_times()
    
    while running:
        try:
            time.sleep(CHECK_INTERVAL)
            
            # Get current file modification times
            current_file_times = get_file_modification_times()
            
            # Check if any files changed
            files_changed = False
            for file_path, mtime in current_file_times.items():
                if file_path not in last_file_times or last_file_times[file_path] != mtime:
                    files_changed = True
                    break
            
            # Also check for new files
            if not files_changed:
                for file_path in current_file_times:
                    if file_path not in last_file_times:
                        files_changed = True
                        break
            
            if files_changed:
                last_file_times = current_file_times
                last_change_time = time.time()
                pending_changes = True
                print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Changes detected, waiting for debounce...")
            
            # Commit if debounce time has passed and there are pending changes
            if pending_changes and (time.time() - last_change_time) >= DEBOUNCE_SECONDS:
                if has_changes():
                    commit_and_push()
                pending_changes = False
                last_file_times = get_file_modification_times()
                
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Error in watcher: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()

