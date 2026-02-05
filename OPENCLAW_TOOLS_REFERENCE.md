# OpenClaw Tools Reference (AI-Ready)

> **Purpose:** A comprehensive reference for Claude Code and AI systems to understand and implement OpenClaw tools by name. Designed for MCP-style integration.

---

## Table of Contents

1. [Core Tools](#core-tools)
2. [Browser Automation](#browser-automation)
3. [Shell & Process](#shell--process)
4. [Web Tools](#web-tools)
5. [Messaging](#messaging)
6. [Nodes & Devices](#nodes--devices)
7. [Scheduling & Automation](#scheduling--automation)
8. [Sessions & Multi-Agent](#sessions--multi-agent)
9. [File Operations](#file-operations)
10. [Image & Media](#image--media)
11. [Memory](#memory)
12. [Skills Library](#skills-library)
13. [Configuration Patterns](#configuration-patterns)

---

## Core Tools

### Tool Groups (Shorthands)

Use these in `tools.allow` / `tools.deny`:

| Group | Tools Included |
|-------|----------------|
| `group:runtime` | `exec`, `bash`, `process` |
| `group:fs` | `read`, `write`, `edit`, `apply_patch` |
| `group:sessions` | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status` |
| `group:memory` | `memory_search`, `memory_get` |
| `group:web` | `web_search`, `web_fetch` |
| `group:ui` | `browser`, `canvas` |
| `group:automation` | `cron`, `gateway` |
| `group:messaging` | `message` |
| `group:nodes` | `nodes` |

---

## Browser Automation

### `browser` Tool

Control web browsers (Chrome/Brave/Edge) via CDP.

#### Actions

| Action | Description | Key Parameters |
|--------|-------------|----------------|
| `status` | Check browser state | `profile` |
| `start` | Launch browser | `profile` |
| `stop` | Close browser | `profile` |
| `tabs` | List open tabs | `profile` |
| `open` | Open URL in new tab | `targetUrl`, `profile` |
| `focus` | Focus specific tab | `targetId`, `profile` |
| `close` | Close specific tab | `targetId`, `profile` |
| `snapshot` | Get page accessibility tree | `snapshotFormat` (aria/ai), `interactive`, `compact`, `depth` |
| `screenshot` | Capture page image | `fullPage`, `type` (png/jpeg), `ref` |
| `navigate` | Go to URL | `targetUrl`, `targetId` |
| `act` | Perform UI action | `request` object (see below) |
| `console` | Get console logs | `level`, `limit` |
| `pdf` | Generate PDF | `targetId` |

#### Action Request Object (for `act`)

```json
{
  "kind": "click|type|press|hover|drag|select|fill|resize|wait|evaluate|close",
  "ref": "12",           // From snapshot (numeric or e12 format)
  "text": "hello",       // For type/fill
  "key": "Enter",        // For press
  "submit": true,        // Submit after type
  "doubleClick": true,   // For click
  "modifiers": ["Shift"] // Key modifiers
}
```

#### Profiles

- `chrome` — Extension relay (your existing Chrome via extension)
- `openclaw` — Managed isolated browser

#### Example Usage

```javascript
// Get browser status
browser({ action: "status", profile: "chrome" })

// Take snapshot for automation
browser({ action: "snapshot", profile: "chrome", interactive: true })

// Click element by ref
browser({ 
  action: "act", 
  profile: "chrome",
  request: { kind: "click", ref: "12" }
})

// Type into input
browser({
  action: "act",
  profile: "chrome", 
  request: { kind: "type", ref: "15", text: "hello world", submit: true }
})
```

---

## Shell & Process

### `exec` Tool

Run shell commands with background support.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `command` | string | **Required.** Shell command to run |
| `workdir` | string | Working directory |
| `env` | object | Environment variables |
| `yieldMs` | number | Auto-background after ms (default: 10000) |
| `background` | boolean | Background immediately |
| `timeout` | number | Kill after seconds (default: 1800) |
| `pty` | boolean | Use pseudo-terminal (for interactive CLIs) |
| `host` | string | `sandbox` \| `gateway` \| `node` |
| `elevated` | boolean | Run with elevated permissions |

#### Example Usage

```javascript
// Simple command
exec({ command: "ls -la" })

// Background long-running task
exec({ command: "npm run build", background: true })

// With environment variables
exec({ 
  command: "python script.py",
  env: { API_KEY: "xxx" },
  timeout: 300
})

// Interactive CLI (needs PTY)
exec({ command: "npm init", pty: true })
```

### `process` Tool

Manage background exec sessions.

#### Actions

| Action | Description | Parameters |
|--------|-------------|------------|
| `list` | List all sessions | — |
| `poll` | Get new output | `sessionId` |
| `log` | Get full log | `sessionId`, `offset`, `limit` |
| `write` | Send stdin | `sessionId`, `data` |
| `send-keys` | Send key sequences | `sessionId`, `keys` |
| `paste` | Paste text | `sessionId`, `text` |
| `submit` | Send Enter | `sessionId` |
| `kill` | Terminate process | `sessionId` |
| `clear` | Clear output buffer | `sessionId` |
| `remove` | Remove session | `sessionId` |

#### Example Usage

```javascript
// Check running processes
process({ action: "list" })

// Poll for output
process({ action: "poll", sessionId: "abc123" })

// Send keyboard input
process({ action: "send-keys", sessionId: "abc123", keys: ["Enter"] })
process({ action: "send-keys", sessionId: "abc123", keys: ["C-c"] }) // Ctrl+C
```

---

## Web Tools

### `web_search` Tool

Search the web via Brave Search API.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | **Required.** Search query |
| `count` | number | Results (1-10) |
| `country` | string | 2-letter country code (e.g., "US", "DE") |
| `search_lang` | string | Language code (e.g., "en", "de") |
| `freshness` | string | Time filter: `pd` (day), `pw` (week), `pm` (month), `py` (year) |

#### Example Usage

```javascript
web_search({ query: "OpenClaw documentation", count: 5 })

web_search({ 
  query: "local restaurants",
  country: "US",
  freshness: "pw"  // Past week
})
```

### `web_fetch` Tool

Fetch and extract content from URLs.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | **Required.** HTTP(S) URL |
| `extractMode` | string | `markdown` \| `text` |
| `maxChars` | number | Truncate after N chars |

#### Example Usage

```javascript
web_fetch({ url: "https://example.com/article" })

web_fetch({ 
  url: "https://docs.openclaw.ai",
  extractMode: "markdown",
  maxChars: 10000
})
```

---

## Messaging

### `message` Tool

Send messages across all channels (Discord, Telegram, WhatsApp, Slack, Signal, iMessage, etc.)

#### Actions

| Action | Description | Key Parameters |
|--------|-------------|----------------|
| `send` | Send message | `target`, `message`, `channel` |
| `broadcast` | Send to multiple targets | `targets`, `message` |
| `poll` | Create poll | `pollQuestion`, `pollOption[]` |
| `react` | Add reaction | `messageId`, `emoji` |
| `edit` | Edit message | `messageId`, `message` |
| `delete` | Delete message | `messageId` |
| `pin` / `unpin` | Pin management | `messageId` |
| `thread-create` | Create thread | `messageId`, `threadName` |
| `thread-reply` | Reply in thread | `threadId`, `message` |
| `search` | Search messages | `query`, `limit` |

#### Channel-Specific Parameters

| Channel | Target Format |
|---------|---------------|
| Discord | `channel:<id>` or `user:<id>` |
| Telegram | `-1001234567890` or `-1001234567890:topic:123` |
| WhatsApp | `+15551234567` |
| Slack | `#channel-name` or `@username` |
| Signal | `+15551234567` |

#### Example Usage

```javascript
// Send to Discord channel
message({
  action: "send",
  channel: "discord",
  target: "channel:123456789",
  message: "Hello from OpenClaw!"
})

// Create a poll
message({
  action: "poll",
  channel: "discord",
  target: "channel:123456789",
  pollQuestion: "What's for lunch?",
  pollOption: ["Pizza", "Tacos", "Sushi"]
})

// React to a message
message({
  action: "react",
  channel: "discord",
  messageId: "123456789",
  emoji: "👍"
})
```

---

## Nodes & Devices

### `nodes` Tool

Control paired devices (iOS, Android, macOS).

#### Actions

| Action | Description | Key Parameters |
|--------|-------------|----------------|
| `status` | List connected nodes | — |
| `describe` | Get node details | `node` |
| `pending` | List pending pairings | — |
| `approve` / `reject` | Handle pairing | `requestId` |
| `notify` | Send notification | `node`, `title`, `body` |
| `run` | Execute command on node | `node`, `command[]` |
| `camera_snap` | Take photo | `node`, `facing` (front/back/both) |
| `camera_clip` | Record video | `node`, `durationMs` |
| `screen_record` | Record screen | `node`, `durationMs`, `fps` |
| `location_get` | Get GPS location | `node` |

#### Example Usage

```javascript
// List connected devices
nodes({ action: "status" })

// Send notification to iPhone
nodes({
  action: "notify",
  node: "my-iphone",
  title: "Reminder",
  body: "Meeting in 5 minutes"
})

// Take photo with front camera
nodes({
  action: "camera_snap",
  node: "my-iphone",
  facing: "front"
})

// Execute command on macOS node
nodes({
  action: "run",
  node: "my-mac",
  command: ["echo", "Hello from remote!"]
})

// Get location
nodes({
  action: "location_get",
  node: "my-iphone"
})
```

### `canvas` Tool

Control node Canvas (WebView display).

#### Actions

| Action | Description | Key Parameters |
|--------|-------------|----------------|
| `present` | Show canvas | `url`, `node` |
| `hide` | Hide canvas | `node` |
| `navigate` | Change URL | `url`, `node` |
| `eval` | Execute JavaScript | `javaScript`, `node` |
| `snapshot` | Capture screenshot | `node`, `outputFormat` |
| `a2ui_push` | Push A2UI content | `jsonl`, `node` |
| `a2ui_reset` | Reset A2UI | `node` |

---

## Scheduling & Automation

### `cron` Tool

Schedule jobs and wake events.

#### Actions

| Action | Description | Key Parameters |
|--------|-------------|----------------|
| `status` | Scheduler status | — |
| `list` | List jobs | `includeDisabled` |
| `add` | Create job | `job` object |
| `update` | Modify job | `jobId`, `patch` |
| `remove` | Delete job | `jobId` |
| `run` | Trigger immediately | `jobId` |
| `runs` | Get run history | `jobId` |
| `wake` | Send wake event | `text`, `mode` |

#### Job Object Schema

```json
{
  "name": "Daily reminder",
  "schedule": {
    "kind": "cron",
    "expr": "0 9 * * *",
    "tz": "America/New_York"
  },
  "payload": {
    "kind": "systemEvent",
    "text": "Check your calendar!"
  },
  "sessionTarget": "main",
  "enabled": true
}
```

#### Schedule Types

| Kind | Description | Example |
|------|-------------|---------|
| `at` | One-shot timestamp | `{ "kind": "at", "atMs": 1704067200000 }` |
| `every` | Recurring interval | `{ "kind": "every", "everyMs": 3600000 }` |
| `cron` | Cron expression | `{ "kind": "cron", "expr": "0 9 * * *", "tz": "America/New_York" }` |

#### Payload Types

| Kind | Target | Description |
|------|--------|-------------|
| `systemEvent` | main | Inject text into main session |
| `agentTurn` | isolated | Run dedicated agent turn |

#### Example Usage

```javascript
// Add a daily reminder
cron({
  action: "add",
  job: {
    name: "Morning briefing",
    schedule: { kind: "cron", expr: "0 8 * * *", tz: "America/New_York" },
    payload: { kind: "systemEvent", text: "Time for morning briefing!" },
    sessionTarget: "main"
  }
})

// Immediate wake
cron({
  action: "wake",
  text: "User requested immediate check",
  mode: "now"
})
```

### `gateway` Tool

Control the OpenClaw Gateway.

#### Actions

| Action | Description |
|--------|-------------|
| `restart` | Restart gateway process |
| `config.get` | Get current config |
| `config.schema` | Get config schema |
| `config.apply` | Write full config + restart |
| `config.patch` | Merge partial update + restart |
| `update.run` | Update dependencies + restart |

---

## Sessions & Multi-Agent

### `sessions_list`

List active sessions.

```javascript
sessions_list({ 
  kinds: ["dm", "group"],
  limit: 20,
  messageLimit: 5  // Include last N messages
})
```

### `sessions_history`

Get session transcript.

```javascript
sessions_history({
  sessionKey: "agent:main:main",
  limit: 50,
  includeTools: true
})
```

### `sessions_send`

Send message to another session.

```javascript
sessions_send({
  sessionKey: "agent:support:user123",
  message: "Escalating your request...",
  timeoutSeconds: 30
})
```

### `sessions_spawn`

Spawn background sub-agent.

```javascript
sessions_spawn({
  task: "Research competitor pricing",
  label: "research-task-1",
  model: "anthropic/claude-sonnet-4-20250514",
  runTimeoutSeconds: 300
})
```

### `session_status`

Get session usage/status.

```javascript
session_status()  // Current session
session_status({ sessionKey: "agent:main:main" })
```

---

## File Operations

### `Read` Tool

Read file contents.

```javascript
Read({ path: "/path/to/file.txt" })
Read({ path: "/path/to/file.txt", offset: 100, limit: 50 })  // Lines 100-150
Read({ path: "/path/to/image.png" })  // Returns image attachment
```

### `Write` Tool

Create or overwrite files.

```javascript
Write({ 
  path: "/path/to/file.txt",
  content: "File contents here"
})
```

### `Edit` Tool

Surgical text replacement.

```javascript
Edit({
  path: "/path/to/file.txt",
  oldText: "old text to find",
  newText: "replacement text"
})
```

---

## Image & Media

### `image` Tool

Analyze images with vision models.

```javascript
image({
  image: "/path/to/image.png",
  prompt: "Describe what you see"
})

image({
  image: "https://example.com/photo.jpg",
  prompt: "Extract text from this image"
})
```

### `tts` Tool

Text-to-speech conversion.

```javascript
tts({
  text: "Hello, this is a test message",
  channel: "telegram"  // Optional: optimize for channel
})
// Returns: MEDIA: /path/to/audio.mp3
```

---

## Memory

### `memory_search`

Semantic search over memory files.

```javascript
memory_search({
  query: "What did we discuss about the project deadline?",
  maxResults: 5,
  minScore: 0.7
})
```

### `memory_get`

Get specific lines from memory files.

```javascript
memory_get({
  path: "memory/2026-01-31.md",
  from: 10,
  lines: 20
})
```

---

## Skills Library

### Available Skills (Bundled)

| Skill | Description | Requires |
|-------|-------------|----------|
| `weather` | Weather forecasts | None |
| `github` | GitHub CLI integration | `gh` binary |
| `openai-image-gen` | DALL-E image generation | `python3`, `OPENAI_API_KEY` |
| `openai-whisper-api` | Audio transcription | `OPENAI_API_KEY` |
| `nano-banana-pro` | Gemini image generation | `uv`, `GEMINI_API_KEY` |
| `coding-agent` | Run Claude Code/Codex | Various |
| `mcporter` | MCP server integration | `mcporter` |
| `clawhub` | Skills marketplace | `clawhub` |
| `skill-creator` | Create new skills | None |

### Using Skills

Skills are invoked via exec or their documented CLI:

```javascript
// Weather (no API key needed)
exec({ command: "curl 'wttr.in/NewYork?format=3'" })

// Gemini image generation
exec({
  command: `uv run /path/to/nano-banana-pro/scripts/generate_image.py --prompt "a sunset" --filename output.png`,
  env: { GEMINI_API_KEY: "your-key" }
})
```

---

## Configuration Patterns

### Tool Policy

```json
{
  "tools": {
    "profile": "full",
    "allow": ["group:fs", "browser", "web_search"],
    "deny": ["exec"]
  }
}
```

### Enable Web Search

```json
{
  "tools": {
    "web": {
      "search": {
        "enabled": true,
        "apiKey": "BRAVE_API_KEY"
      }
    }
  }
}
```

### Enable Browser

```json
{
  "browser": {
    "enabled": true,
    "defaultProfile": "chrome",
    "profiles": {
      "openclaw": { "cdpPort": 18800 }
    }
  }
}
```

### Skill Configuration

```json
{
  "skills": {
    "entries": {
      "nano-banana-pro": {
        "enabled": true,
        "apiKey": "GEMINI_API_KEY"
      }
    }
  }
}
```

---

## Quick Reference Card

| Task | Tool | Example |
|------|------|---------|
| Search web | `web_search` | `web_search({ query: "..." })` |
| Fetch page | `web_fetch` | `web_fetch({ url: "..." })` |
| Run command | `exec` | `exec({ command: "..." })` |
| Browser snapshot | `browser` | `browser({ action: "snapshot" })` |
| Click element | `browser` | `browser({ action: "act", request: { kind: "click", ref: "12" }})` |
| Send message | `message` | `message({ action: "send", target: "...", message: "..." })` |
| Take photo | `nodes` | `nodes({ action: "camera_snap", node: "..." })` |
| Schedule job | `cron` | `cron({ action: "add", job: {...} })` |
| Read file | `Read` | `Read({ path: "..." })` |
| Write file | `Write` | `Write({ path: "...", content: "..." })` |
| Analyze image | `image` | `image({ image: "...", prompt: "..." })` |

---

*Generated by Jaygo 🗡️ | Last updated: 2026-01-31*
