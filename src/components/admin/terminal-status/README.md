# Terminal Status Component

A minimalist terminal-style status monitor for your admin panel that displays real-time health information for all AI services and tools.

## Features

- **Real-time monitoring** of AI services (Ollama, SearXNG, Weather API, Exchange Rate API)
- **Terminal aesthetic** with Commit Mono font and classic green-on-black styling
- **Status indicators** with color-coded icons (✓ Ready, ⚠ Slow, ⚡ Timeout, ✗ Offline, 🔄 Checking)
- **Response time tracking** with performance metrics
- **Auto-scrolling** terminal output with configurable line limits
- **Health summary** showing operational services and average response times

## Usage

```tsx
import { TerminalStatus } from '@/components/admin/terminal-status';

// Basic usage
<TerminalStatus />

// With custom configuration
<TerminalStatus 
  maxLines={20}
  autoScroll={true}
  refreshInterval={10000}
  className="custom-class"
/>
```

## Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `maxLines` | `number` | `20` | Maximum number of log lines to display |
| `autoScroll` | `boolean` | `true` | Auto-scroll to bottom when new entries arrive |
| `refreshInterval` | `number` | `10000` | Health check interval in milliseconds |
| `className` | `string` | - | Additional CSS classes |

## Status Indicators

- 🟢 **[READY]** - Service responding in < 1 second
- 🟡 **[SLOW]** - Service responding in 1-3 seconds  
- 🟠 **[TIMEOUT]** - Service responding in > 3 seconds
- 🔴 **[OFFLINE]** - Service not responding or error
- 🔵 **[CHECKING]** - Currently testing service

## Monitored Services

1. **AI Model (Ollama)** - Main AI inference engine
2. **Web Search (SearXNG)** - Search aggregation service
3. **Weather API** - Weather data provider
4. **Exchange Rate API** - Currency conversion service

## Environment Variables

The component automatically reads these environment variables:

- `VITE_OLLAMA_URL` - Ollama API endpoint
- `VITE_SEARXNG_URL` - SearXNG search endpoint

## Styling

The component uses a custom CSS file with terminal-inspired styling:

- **Font**: Commit Mono (Google Fonts)
- **Colors**: Terminal green (#00ff00), amber warnings, red errors
- **Background**: Terminal black (#0a0a0a)
- **Animations**: Fade-in effects, pulse for checking status

## Integration

Currently integrated into the admin panel bento grid layout, occupying a 2x2 grid space for optimal visibility.

## Future Enhancements

- Historical performance graphs
- Service dependency mapping  
- Alert thresholds and notifications
- Export logs functionality
- Integration with LLM context for smart tool selection