# Financial Schema Documentation

## Universal Extracted-Fact Schema
Every financial fact extracted by AI CPA Core conforms to the universal schema:
- `id`: Unique fact UUID
- `workspace_id`: Workspace scope
- `document_id`: Source document reference
- `fact_type`: (revenue, expense, asset, liability, etc.)
- `label_original`: Original label in document
- `value_original`: Original amount string
- `currency_original`: ISO currency code
- `value_functional`: Converted functional amount
- `functional_currency`: Target currency (e.g. USD)
- `exchange_rate`: Applied rate
- `period_start` / `period_end`: ISO date range
- `confidence`: 0.0 to 1.0
- `status`: proposed, approved, rejected, corrected
- `extraction_method`: Hermes consensus / LLM / deterministic
