---
name: scaffold-wxpython-app
description: Scaffold an accessible wxPython desktop application with sizers, keyboard nav, and screen reader support
mode: agent
agent: wxpython-specialist
tools:
  - askQuestions
  - readFile
  - runInTerminal
  - getTerminalOutput
  - editFile
  - createFile
---

# Scaffold Accessible wxPython Application

Create a new wxPython desktop application with proper sizer-based layout, accessible controls, keyboard navigation, and screen reader support.

## Input

**Application Name:** `${input:appName}`

## Instructions

1. **Create the project structure:**
   - `main.py` — application entry point with `wx.App` subclass
   - `ui/main_frame.py` — main frame with sizer layout
   - `ui/__init__.py` — package init
   - `requirements.txt` — with wxPython dependency

2. **Build the main frame** (`wx.Frame`) with:
   - A `wx.MenuBar` with File and Help menus
   - Keyboard accelerators (Ctrl+Q for quit, Ctrl+O for open, F1 for help)
   - A `wx.StatusBar` for screen reader announcements via `SetStatusText()`
   - A proper window title that describes the application

3. **Use sizer-based layout** (never absolute positioning):
   - `wx.BoxSizer` or `wx.GridBagSizer` for control arrangement
   - Proper proportion and flag values for resizable layouts
   - `wx.StaticText` labels associated with their controls via sizer ordering

4. **Ensure accessible controls:**
   - Every input control has a preceding `wx.StaticText` label
   - Set `SetName()` on controls where the label association is ambiguous
   - Use `wx.StaticBox` with `wx.StaticBoxSizer` for logical grouping
   - Set `SetHelpText()` on controls for screen reader tooltip descriptions

5. **Implement keyboard navigation:**
   - Logical tab order following visual reading order (set by sizer add order)
   - No tabindex workarounds; rely on sizer ordering
   - Escape key closes dialogs
   - Enter key activates the default button (set with `SetDefault()`)

6. **Ask the user** what type of application they are building (data entry form, file browser, settings panel, etc.) and tailor the scaffold accordingly.
