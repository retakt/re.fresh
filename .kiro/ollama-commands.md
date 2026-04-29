# Ollama Slash Commands Reference

These work in `ollama run <model>` interactive CLI sessions.
They do NOT work through the API — they are CLI-only.

## Session Commands
| Command | Description |
|---|---|
| `/set think` | Enable thinking mode |
| `/set nothink` | Disable thinking mode |
| `/set parameter <key> <value>` | Set a parameter (e.g. temperature) |
| `/set system <string>` | Set system message |
| `/set history` | Enable history |
| `/set nohistory` | Disable history |
| `/set wordwrap` | Enable wordwrap |
| `/set nowordwrap` | Disable wordwrap |
| `/set format json` | Enable JSON mode |
| `/set noformat` | Disable formatting |
| `/set verbose` | Show LLM stats |
| `/set quiet` | Disable LLM stats |
| `/show` | Show model information |
| `/load <model>` | Load a session or model |
| `/save <model>` | Save current session |
| `/clear` | Clear session context |
| `/bye` | Exit |

## API Equivalents (what we use in chat.tsx)
| CLI | API equivalent |
|---|---|
| `/set think` | `"think": true` in request body |
| `/set nothink` | `"think": false` in request body |
| `/set parameter temperature 0.5` | `options.temperature` in request body |
| `/set parameter top_k 20` | `options.top_k` in request body |
| `/set system "..."` | `messages[0]` with `role: "system"` |

## Wiring Status
- [x] `think: true` — wired in adapter
- [x] system prompt — wired in adapter
- [x] temperature / top_k / top_p — wired in adapter
- [ ] slash commands from chat UI — planned
