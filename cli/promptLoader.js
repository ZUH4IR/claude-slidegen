import fs from "fs";
import Mustache from "mustache";

export function load(path) {
  return fs.readFileSync(`prompts/${path}`, "utf8");
}

export function merge(engine, brand, campaign, ctx) {
  const txt = engine + "\n\n" + brand + (campaign ? "\n\n" + campaign : "");
  return Mustache.render(txt, ctx);
}
