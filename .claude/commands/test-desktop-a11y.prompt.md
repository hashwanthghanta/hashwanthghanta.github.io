---
name: test-desktop-a11y
description: Create a desktop accessibility test plan with screen reader test cases and automated UIA scaffolding
mode: agent
agent: desktop-a11y-testing-coach
tools:
  - askQuestions
  - readFile
  - runInTerminal
  - getTerminalOutput
  - editFile
  - createFile
---

# Desktop Accessibility Test Plan

Generate a comprehensive desktop accessibility test plan with manual screen reader test cases, keyboard-only testing flows, high contrast verification, and automated UIA test scaffolding.

## Input

**Application Path:** `${input:appPath}`

## Instructions

1. **Analyze the application** at the provided path to identify all screens, dialogs, and interactive controls.

2. **Generate screen reader test cases** covering:
   - **NVDA:** Test each screen with browse mode and focus mode; verify virtual buffer content; check object navigation
   - **JAWS:** Verify forms mode behavior, virtual cursor navigation, and custom verbosity announcements
   - **Narrator:** Test Scan Mode navigation, landmark detection, and touch interaction (if applicable)
   - **VoiceOver (macOS):** Test VO cursor navigation, rotor categories, and VO key shortcuts
   - Each test case should specify: preconditions, steps, expected screen reader output, and pass/fail criteria

3. **Create keyboard-only testing flows:**
   - Tab order walkthrough for each screen
   - Arrow key navigation within composite controls
   - Shortcut key and accelerator key inventory
   - Focus trap verification for modal dialogs
   - Focus restoration after dialog dismiss

4. **High contrast verification checklist:**
   - Enable Windows High Contrast mode and verify each screen
   - Check custom-drawn controls for visibility
   - Verify icon legibility in both light and dark high contrast themes
   - Check that focus indicators remain visible

5. **Generate automated UIA test scaffold:**
   - Create a test file using Python `uiautomation` or `comtypes.client` with UIA patterns
   - Include test functions that assert: accessible names, roles, states, and patterns on key controls
   - Include a helper to launch the application and find the main window
   - Add assertions for keyboard focus movement

6. **Output the test plan** as a markdown document with sections for manual tests, keyboard tests, high contrast tests, and a separate Python test file for automated UIA tests.
