import fs from "fs";
import YAML from "yaml";

const blue = YAML.parse(
  fs.readFileSync("prompts/blueprints.yaml", "utf8")
);

export function header(bpId) {
  if (!blue[bpId]) throw new Error("unknown blueprint " + bpId);
  const order = blue[bpId].order;
  const cols = [
    "icp","hook_appeal","hook_top_text","hook_bottom_text","hook_image_query"
  ];
  order.slice(1).forEach((_, i) => {
    cols.push(`slide${i+2}_top_text`);
    cols.push(`slide${i+2}_bottom_text`);
    cols.push(`slide${i+2}_image_query`);
  });
  cols.push("caption");
  return cols.join(",");
}
