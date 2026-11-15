# RECONCILIATION & ACQUISITION PLAN

## 1. Overview
The target scope is strictly the **first three Samhitas**:
1. **Charaka Samhita** (11,175 expected questions)
2. **Sushruta Samhita** (8,709 expected questions)
3. **Ashtanga Hridaya** (6,229 expected questions)
**Total Target:** **26,113 question assignments** across 498 hierarchy nodes.

---

## 2. Extraction Pipeline Architecture
```
[Mapping: first_three_samhitas.mapping.json]
                    │
                    ▼
[Source Crosswalk: docs/source_to_mapping_crosswalk.json (498/498 matched)]
                    │
                    ▼
[Batch Fetch Engine: scripts/fetch_fresh_samhitas.py]
  - Controlled concurrency & rate limiting (1.0s between requests)
  - Exponential backoff & jitter on transient network errors
  - SHA-256 payload hashing for auditable provenance
  - Checkpoint persistence (allows clean resume)
                    │
                    ▼
[Validation & Quarantine Pipeline]
  - Stem non-empty check
  - 4 options non-empty check
  - Valid correct_answer (1..4) check
  - Reconcile expected count vs actual fetched count per node
  - Quarantine malformed or ambiguous questions
                    │
                    ▼
[SQLite Ingestion: data/fresh_samhita_questions.sqlite]
  - Created strictly from db/schema.sql
  - mapping_nodes (498 records)
  - fetch_runs (audit records)
  - questions (normalized content)
  - options (normalized options)
  - question_locations (many-to-many category assignments)
  - ingest_issues (non-blocking / blocking issues)
```

---

## 3. Strict Non-Fabrication Rules
1. Zero importing from legacy databases.
2. If an endpoint is temporarily unavailable, record an issue in `ingest_issues`, mark the node as `partial` or `unavailable`, and do NOT invent filler questions.
3. Every question rendered in the portal must be linked to its validated source run and category.

