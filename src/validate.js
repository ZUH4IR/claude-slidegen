export function validate(csv, expectedCols) {
    const [, ...rows] = csv.split("\n");
    const issues = [];
    rows.forEach((r, i) => {
      if (r.split(",").length !== expectedCols) {
        issues.push(`row ${i+1}: wrong column count`);
      }
    });
    return issues;
  }
  