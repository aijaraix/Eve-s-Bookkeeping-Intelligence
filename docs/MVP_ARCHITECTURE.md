# MVP Architecture: AI CPA Core

## System Architecture
```
[Client / Browser (React SPA)]
           |
       (HTTPS / REST)
           v
[Express API Gateway & Hermes 4-Agent Orchestrator]
           |
           +---> [Gemini API / LLM Provider Abstraction]
           +---> [Document Intelligence & OCR Engine]
           +---> [Deterministic Financial Calculator & Validator]
           +---> [PostgreSQL / Secure Workspace Storage]
```

## Core Layers
1. **Hermes 4-Agent Consensus Bureau**: Prime agent orchestrates Agent Alpha, Agent Beta, and Agent Gamma in parallel feature extractions to reach high-confidence consensus.
2. **Four-Layer Accounting Data Model**:
   - Layer 1: Original Evidence & SHA-256 Hashes
   - Layer 2: Extracted Evidence & Tables
   - Layer 3: Proposed Financial Facts
   - Layer 4: Approved Facts & Audit Trail
