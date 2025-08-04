#!/usr/bin/env node
import { load, merge } from "./promptLoader.js";
import { header }      from "./blueprint.js";
import { askClaude }   from "./claude.js";
import { validate }    from "./validate.js";

const brandSlug = "brands/vibit_core_v1.md";
const campSlug  = "campaigns/vibit_older_v1.md";
const blueprint = "story_6";
const rows      = 2;

const ctx = {
  brand_name: "vibit",
  blueprint_id: blueprint,
  csv_header: header(blueprint),
  mode: "hooks",
  rows,
  persona: "older",
  hook_appeal: "drama",
  topic: "doctor said never run again but i proved him wrong",
  char_cap_hook: 95,
  add_selfAwareJoke: true,
  product_slide: 5,
};

const engine   = load("universal_engine_v1.md");
const brandMod = load(brandSlug);
const campMod  = load(campSlug);

// ---------- STEP 1 : hooks ----------
let sys = merge(engine, brandMod, campMod, ctx);
const hooksText = await askClaude(sys);
console.log("\nHOOKS\n-----\n" + hooksText);

// simulate user approval
const approvedHooks = hooksText
  .split("\n")
  .map(l => l.replace(/^\d+[\).\s]*/, "").trim());

ctx.mode  = "csv";
ctx.hooks = approvedHooks;

// ---------- STEP 2 : csv ----------
sys = merge(engine, brandMod, campMod, ctx);
const csv = await askClaude(sys);
console.log("\nCSV\n---\n" + csv);

// validate
const errs = validate(csv, header(blueprint).split(",").length);
console.log(errs.length ? "❌ " + errs.join("; ") : "✅ passes validation");
