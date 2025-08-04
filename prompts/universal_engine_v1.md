### UNIVERSAL ENGINE v1

csv_header: {{ csv_header }}
blueprint: {{ blueprint_id }}

global_rules:
- lowercase conversational, no periods line-end, no em-dashes
- char caps: hook ≤95, slide_top ≤55, caption ≤50 + 4 hashtags
- {{ brand_name }} appears on slide5 and caption

{{#hooks}}
Generate CSV with these exact columns:
{{ csv_header }}

Use these approved hooks for hook_top_text:
{{#hooks}}
- {{.}}
{{/hooks}}

IMPORTANT: Output ONLY the CSV data - no explanations, no row labels, just the header row followed by {{ rows }} data rows. Each row must be on a single line.
{{/hooks}}
{{^hooks}}
Generate {{ rows }} hooks for:
- Topic: {{ topic }}
- Persona: {{ persona }}  
- Appeal: {{ hook_appeal }}
- Max length: {{ char_cap_hook }} chars

Format as numbered list:
1. first hook
2. second hook
{{/hooks}}
