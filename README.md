# EvalGuard — agent & tool-calling evaluation, try it locally

Evaluate your AI agents' **tool selection, parameter accuracy, tool sequencing,
and goal completion** with zero account and zero API key. Everything here runs
on your machine against the public `@evalguard/core` npm package.

## 1. Script — score a recorded agent run

```bash
npm install
node agent-eval.mjs
```

Expected output (a correct run scores 1.00; a broken run is caught and explained):

```
===== GOOD run =====
  tool-correctness           1.00  PASS  — All 3 tools matched
  trajectory-tool-args       1.00  PASS  — "search_flights" called with correct args (2/2 matched)
  trajectory-tool-sequence   1.00  PASS  — correct order: search_flights → get_weather → book_flight
  trajectory-goal-success    0.86  PASS  — 6/7 goal keywords found in output
  general-task-completion    1.00  PASS  — Met 3/3 success criteria
===== BAD  run (booked w/o searching; wrong city) =====
  tool-correctness           0.33  FAIL  — Missing: search_flights, book_flight
  trajectory-tool-args       0.00  FAIL  — Tool "search_flights" was not called
  trajectory-tool-sequence   0.00  FAIL  — Found 0/3 tools in order
  trajectory-goal-success    0.43  FAIL  — 3/7 goal keywords found in output
  general-task-completion    0.33  FAIL  — Met 1/3. Unmet: London, 18C
```

Edit the `toolCalls` arrays in `agent-eval.mjs` to score one of **your own**
Agent Builder traces (the tool name + args + result it recorded, plus the final
answer).

## 2. CLI — run a prompt suite across models (offline with `echo`)

```bash
npx @evalguard/cli eval:local agent-suite.json
```

Expected: `general-task-completion: 1.00  ·  1 passed, 0 failed (100.0%)`.

`eval:local` runs your `prompt` against the model for each case `input`, then
scores the output. `agent-suite.json` sets `model`/`provider: "echo"` so it runs
with **no API key**; point them at any provider (OpenAI, Anthropic, Gemini,
Bedrock, local/vLLM, …) to generate + score live, and add scorers +
`scorerOptions`.

> For scoring **recorded agent traces** (the tool calls / args / sequence your
> agent already made), use `agent-eval.mjs` in step 1 — it feeds the trajectory
> straight to the scorers. The CLI's `eval:local` is for prompt→output suites.

Python team: `pip install evalguardai` (imports as `import evalguard`).

## 3. Browse all scorers

```bash
node -e "import('@evalguard/core/scorers/registry').then(m=>console.log(Object.keys(m.BUILT_IN_SCORERS).join('\n')))"
```

There are 200+. The agent/tool-calling family includes: `tool-correctness`,
`trajectory-tool-used`, `trajectory-tool-sequence`, `trajectory-tool-args`,
`trajectory-goal-success`, `trajectory-step-count`, `trajectory-no-loops`,
`multi-step-coherence`, `plan-adherence`, `mcp-use`, `mcp-task-completion`, plus
faithfulness / hallucination / relevance for the final response.

## 4. Hosted (across LLMs, with reports + signed evidence)

Sign up at **https://evalguard.ai**, grab an API key in Settings, and run the
same suites across providers side-by-side with per-case drill-downs and
exportable, cryptographically signed evidence bundles (mapped to ISO 42001 /
NIST AI RMF / EU AI Act). API: `POST /api/v1/evals` with `cases` + `scorers` +
`scorerOptions`.
