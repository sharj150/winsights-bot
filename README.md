# Winsights Bot

A bot project for Winsights.

## 🚀 Repository Setup

This repository is connected to GitHub and configured with **automatic commit and push** functionality.

**GitHub Repository:** https://github.com/sharj150/winsights-bot

## 💾 Auto-Save Feature

The auto-save feature automatically commits and pushes your changes to GitHub whenever you modify files. No need to manually commit at the end of each coding session!

### How It Works

- Watches for file changes in the repository
- Waits 5 seconds after the last change (debounce) before committing
- Automatically stages, commits, and pushes changes to GitHub
- Runs in the background

### Commands

**Start auto-save:**
```bash
./autosave.sh start
```

**Stop auto-save:**
```bash
./autosave.sh stop
```

**Check status:**
```bash
./autosave.sh status
```

**Restart auto-save:**
```bash
./autosave.sh restart
```

### Auto-Save Status

The auto-save watcher is currently **running** and will automatically save your changes to GitHub.

### Logs

View auto-save activity:
```bash
tail -f .autosave.log
```

