---
name: scaffold-nvda-addon
description: Scaffold a new NVDA screen reader addon project with structure, manifest, and boilerplate
mode: agent
agent: nvda-addon-specialist
tools:
  - askQuestions
  - readFile
  - runInTerminal
  - getTerminalOutput
  - editFile
  - createFile
---

# Scaffold NVDA Addon

Create a new NVDA screen reader addon project with the standard directory structure, manifest, and boilerplate code.

## Input

**Addon Name:** `${input:addonName}`

## Instructions

1. **Create the project directory structure:**
   - `addon/` — main addon package directory
   - `addon/globalPlugins/` — for global plugin addons
   - `addon/appModules/` — for app module addons
   - `addon/doc/en/` — documentation directory

2. **Generate `addon/manifest.ini`** with required fields:
   - `name` — the addon identifier (derived from the addon name)
   - `summary` — human-readable addon name
   - `description` — brief description placeholder
   - `author` — placeholder for author name
   - `version` — initial version `0.1.0`
   - `url` — placeholder URL
   - `minimumNVDAVersion` — set to `2023.1`
   - `lastTestedNVDAVersion` — set to `2024.1`

3. **Create `addon/globalPlugins/__init__.py`** with a `GlobalPlugin` class skeleton that includes:
   - Proper NVDA imports (`globalPluginHandler`, `scriptHandler`, `ui`, `api`)
   - A `GlobalPlugin` class extending `globalPluginHandler.GlobalPlugin`
   - An example script method with `script` decorator and gesture binding
   - Docstrings explaining the addon purpose

4. **Create `buildVars.py`** with standard NVDA addon build variables:
   - `addon_info` dictionary with name, summary, description, version, author, and URL
   - Matches values from the manifest

5. **Create a `README.md`** with:
   - Addon name and description
   - Installation instructions
   - Usage overview
   - Development setup instructions (how to build and test)
   - License placeholder

6. **Ask the user** whether this should be a global plugin or an app module, and adjust the skeleton accordingly.
