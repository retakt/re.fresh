/**
 * ai-tools.ts
 * Tool definitions sent to Ollama so the model knows what it can call.
 * Add new tools here — no need to touch chat.tsx or ai-executors.ts.
 */

export const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description:
        "Get current weather conditions and temperature for any city. Use this when the user asks about weather, temperature, rain, humidity, or conditions in any location.",
      parameters: {
        type: "object",
        required: ["city"],
        properties: {
          city: { type: "string", description: "City name, e.g. 'Kuala Lumpur', 'Tokyo', 'London'" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_exchange_rate",
      description:
        "Get live currency exchange rates. Use this when the user asks about currency conversion, exchange rates, or how much something costs in another currency.",
      parameters: {
        type: "object",
        required: ["from", "to"],
        properties: {
          from: { type: "string", description: "Source currency code, e.g. 'MYR', 'USD', 'EUR'" },
          to: {
            type: "string",
            description: "Target currency code, e.g. 'USD', 'JPY', 'GBP'. Use 'ALL' to get all rates.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_time",
      description:
        "Get the current time in any city or timezone. Use this when the user asks what time it is somewhere, or wants to compare times between cities.",
      parameters: {
        type: "object",
        required: ["timezone"],
        properties: {
          timezone: {
            type: "string",
            description:
              "IANA timezone name e.g. 'Asia/Kuala_Lumpur', 'America/New_York', 'Europe/London', 'Asia/Tokyo'",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description:
        "Search the web for current information. Choose the mode based on what is needed: 'factcheck' for quick 2-result verification when you are uncertain (fast, use proactively), 'general' for user-requested searches (5 results), 'news' for current events and recent news (3 results), 'reddit' for opinions, discussions, recommendations and community experiences (3 results), 'wiki' for factual definitions and encyclopedic information (2 results), 'code' for programming questions, libraries, and technical issues (3 results). Always use factcheck mode proactively when you are not confident about a fact or after 2-3 turns where accuracy matters.",
      parameters: {
        type: "object",
        required: ["query", "mode"],
        properties: {
          query: { type: "string", description: "The search query. Be specific and concise." },
          mode: {
            type: "string",
            description:
              "Search mode: 'factcheck' (quick verify, 2 results), 'general' (5 results), 'news' (current events, 3 results), 'reddit' (opinions/discussions, 3 results), 'wiki' (encyclopedia, 2 results), 'code' (programming, 3 results)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_system_status",
      description:
        "Get real-time status of all AI system services including Ollama, SearXNG, Weather API, and Exchange Rate API. Use this when user asks about system health, service status, or if something isn't working properly.",
      parameters: {
        type: "object",
        properties: {
          detailed: {
            type: "boolean",
            description: "Whether to include detailed response times and error messages",
            default: false,
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_ai_tools_status",
      description:
        "Get real-time status and performance metrics of all AI tools. Returns service health (READY/SLOW/DOWN) and response times in milliseconds. Use when user asks about: tool availability, service status, response times, performance, which tool is fastest/slowest, or if tools are working. Can check all tools or a specific tool by name.",
      parameters: {
        type: "object",
        properties: {
          tool_name: {
            type: "string",
            description:
              "Optional: specific tool to check (AI Model, Web Search, Weather API, Exchange Rate API, YouTube Backend). Leave empty for all tools.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "execute_command",
      description:
        "Execute any shell command in a sandboxed Linux environment on the server. The sandbox has Python 3, Node.js, git, curl, bash, pip, npm pre-installed. Your scripts are at /home/user/scripts/. Your read/write workspace is at /home/user/workspace/. The sandbox is fully isolated — it cannot access the host server files. Use this for: running code, testing scripts, building things, checking files, installing packages, or any shell task.",
      parameters: {
        type: "object",
        required: ["command"],
        properties: {
          command: {
            type: "string",
            description:
              "The shell command to run. Examples: 'ls /home/user/scripts/', 'python3 --version', 'pip install requests && python3 -c \"import requests; print(requests.get(\\\"https://httpbin.org/get\\\").status_code)\"'",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_repo",
      description:
        "Clone a git repository from a URL and run a comprehensive technical analysis on it. Generates a detailed report covering: project overview, directory structure, tech stack, core modules, execution workflows, architecture, onboarding guide, and risk assessment. Use when user asks to analyze, review, or understand a codebase.",
      parameters: {
        type: "object",
        required: ["repo_url"],
        properties: {
          repo_url: {
            type: "string",
            description: "Full HTTPS git URL of the repository, e.g. 'https://github.com/user/repo'",
          },
          depth: {
            type: "number",
            description: "Directory scan depth (default 2, increase for deeply nested projects)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_script",
      description:
        "Run a pre-approved server script in the sandbox. Available scripts: health-check (full system health), check-ollama (AI model status), check-searxng (web search status), check-all-ai (all AI services), ai-tools-status (AI tools via API), monitor-status (background monitor logs). Use when user asks about server health or specific service checks.",
      parameters: {
        type: "object",
        required: ["script"],
        properties: {
          script: {
            type: "string",
            description:
              "Script name. One of: health-check, check-ollama, check-searxng, check-all-ai, ai-tools-status, monitor-status",
            enum: [
              "health-check",
              "check-ollama",
              "check-searxng",
              "check-all-ai",
              "ai-tools-status",
              "monitor-status",
            ],
          },
          args: { type: "string", description: "Optional arguments to pass to the script" },
        },
      },
    },
  },
] as const;
