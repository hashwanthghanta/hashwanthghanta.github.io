# Enhancements

**Status:** In Progress  
**Created:** 2026-03-11  
**Last Updated:** 2026-06-22

---

## Completed Enhancements

The following enhancement plans have been fully implemented and are documented in the CHANGELOG.

### Playwright Integration (v3.2.0)

All priorities P1–P7 implemented except P4.4 (component audit caching — deferred). See original plan in git history.

- **P1: Core MCP Tools** — 5 Playwright tools (keyboard, state, viewport, contrast, a11y tree)
- **P2: Agent Layer** — playwright-scanner and playwright-verifier agents, playwright-testing skill
- **P3: Wizard Integration** — Phase 0 env detection, Phase 10 behavioral testing, fix verification
- **P4: Test Generation** — Test file generation, generate-a11y-tests prompt, CI workflow template
- **P5: Cross-Analysis** — Accessibility tree diffing, keyboard flow comparison
- **P6: veraPDF** — run_verapdf_scan MCP tool with availability detection
- **P7: PDF Forms** — convert_pdf_form_to_html MCP tool with accessible HTML generation

### MCP Server Architecture (Unreleased)

- Migrated from stdio-only desktop-extension to HTTP-based MCP server
- Streamable HTTP + SSE transport, stateful/stateless modes
- 16 tools, 3 prompts, 3 resources
- Test suite with 52 tests (Node built-in test runner)
- npm publish-ready package

---

## Remaining / Deferred

### P4.4: Component Audit Caching

**Status:** Deferred  
**From:** Playwright Integration Plan

Cache scanned file hashes to skip unchanged files on re-audit. Design system token changes invalidate all consumers.

- Store `{hash, findings[]}` in `.a11y-cache.json`
- Invalidation: token file changes propagate to all consumers
- Requires integration with web-accessibility-wizard Phase 0

---

## Have an Idea?

Open an [issue](https://github.com/Community-Access/accessibility-agents/issues/new) or start a [discussion](https://github.com/Community-Access/accessibility-agents/discussions).
