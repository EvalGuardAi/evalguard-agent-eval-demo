/**
 * EvalGuard — agent / tool-calling evaluation, run locally (no account, no API key).
 *
 *   npm install        # pulls @evalguard/core from npm
 *   node agent-eval.mjs
 *
 * Every scorer takes your agent's recorded run (the tool calls it made — name,
 * args, result — plus the final answer) and returns { score, passed, reason }.
 * `BUILT_IN_SCORERS` holds 200+ scorers by name; `Object.keys(S)` to browse.
 *
 * Swap the `toolCalls` arrays below for one of your own Agent Builder traces.
 */

import { BUILT_IN_SCORERS as S } from "@evalguard/core/scorers/registry";

// ── A correct multi-tool run ────────────────────────────────────────────────
// Task: "Book the cheapest NYC→London flight next Friday and tell me the weather there."
const good = {
  output: "Booked the cheapest flight BA178 (NYC→London, $420). London weather: 18C, cloudy.",
  metadata: {
    toolCalls: [
      { name: "search_flights", args: { from: "NYC", to: "LON" }, result: [{ id: "BA178", price: 420 }, { id: "VS4", price: 510 }] },
      { name: "get_weather",    args: { city: "London" },         result: { tempC: 18, cond: "cloudy" } },
      { name: "book_flight",    args: { flightId: "BA178" },      result: { confirmation: "BA178-OK" } },
    ],
    successCriteria: ["Booked", "London", "18C"],
  },
};
good.metadata.trajectory = good.metadata.toolCalls;

// ── A broken run: books WITHOUT searching, checks the WRONG city ─────────────
const bad = {
  output: "I booked a flight and the weather in Paris is 25C.",
  metadata: {
    toolCalls: [
      { name: "book_flight", args: { flightId: "GUESS1" }, result: { error: "unknown flight" } },
      { name: "get_weather", args: { city: "Paris" },      result: { tempC: 25, cond: "sunny" } },
    ],
    successCriteria: ["Booked", "London", "18C"],
  },
};
bad.metadata.trajectory = bad.metadata.toolCalls;

// ── Which scorers to run + their options ────────────────────────────────────
const checks = {
  "tool-correctness":         { expectedTools: [{ name: "search_flights" }, { name: "get_weather" }, { name: "book_flight" }], mode: "ordered" }, // right tools, right args, no extras
  "trajectory-tool-args":     { toolName: "search_flights", expectedArgs: { from: "NYC", to: "LON" } },                                            // parameter accuracy
  "trajectory-tool-sequence": { expectedSequence: ["search_flights", "get_weather", "book_flight"] },                                             // ordering
  "trajectory-goal-success":  { goal: "book the cheapest NYC to London flight and report the London weather" },                                   // did it actually achieve the goal
  "general-task-completion":  {},                                                                                                                  // output vs success criteria
};

const missing = Object.keys(checks).filter((n) => !S[n]);
if (missing.length) { console.error("Missing scorers (update @evalguard/core?):", missing.join(", ")); process.exit(1); }

for (const [label, ctx] of [["GOOD run", good], ["BAD  run (booked w/o searching; wrong city)", bad]]) {
  console.log(`\n===== ${label} =====`);
  for (const [name, opts] of Object.entries(checks)) {
    const r = await S[name].fn(ctx, opts);
    const score = (r.score ?? 0).toFixed(2);
    console.log(`  ${name.padEnd(26)} ${score}  ${r.passed ? "PASS" : "FAIL"}  — ${String(r.reason ?? "").slice(0, 70)}`);
  }
}

console.log("\nBrowse all scorers:  node -e \"import('@evalguard/core/scorers/registry').then(m=>console.log(Object.keys(m.BUILT_IN_SCORERS).join(', ')))\"");
