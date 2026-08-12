# Fact Registry Architecture

## Data Schema & Value Origin
Every extracted fact is assigned a unique `fact_id` and tracks both its original reported representation and normalized functional amount:

- **Value Origin**: Must be explicitly classified as `REPORTED`, `CALCULATED`, or `INFERRED`.
- **Scale & Currency**: Stores original unit scale (`Millions`, `Thousands`, `Units`) and converts to normalized numeric integer values.
- **Source Lineage**: Binds page numbers, table titles, row labels, column headers, and verbatim text snippets.
