# Ask Eve RAG Retrieval Architecture

## Retrieval & Citation Pipeline
- **Workspace Filtering**: Restricts search results strictly to the active workspace to prevent cross-tenant data leaks.
- **Source Grounding**: Formats retrieved facts and source blocks into structured context before sending to Claude 3.7 Sonnet / Gemini.
- **Citation Provenance**: Every output claim includes explicit document name, page number, and fact ID citations.
