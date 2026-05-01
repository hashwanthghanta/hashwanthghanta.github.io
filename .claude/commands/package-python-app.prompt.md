---
name: package-python-app
description: Package a Python application for distribution using PyInstaller, Nuitka, or cx_Freeze
mode: agent
agent: python-specialist
tools:
  - askQuestions
  - readFile
  - runInTerminal
  - getTerminalOutput
  - editFile
  - createFile
---

# Package Python Application

Package a Python application into a distributable executable using PyInstaller, Nuitka, or cx_Freeze.

## Input

**Entry Point:** `${input:entryPoint}`

## Instructions

1. **Analyze the entry point** and scan imports to detect:
   - All direct and transitive dependencies
   - Data files, images, sounds, or other non-Python resources
   - Accessibility-related resources (screen reader DLLs, UIA interop assemblies, accessible UI libraries)
   - The UI framework in use (wxPython, PyQt, Tkinter, etc.)

2. **Ask the user** which packaging tool to use:
   - **PyInstaller** — widest compatibility, simplest setup
   - **Nuitka** — compiles to C for better performance
   - **cx_Freeze** — good for MSI installer output
   - Recommend PyInstaller if the user is unsure

3. **Create the packaging configuration:**
   - **PyInstaller:** Generate a `.spec` file with proper `Analysis`, `PYZ`, `EXE`, and `COLLECT` sections; include hidden imports and data files
   - **Nuitka:** Generate a build command with `--standalone`, `--include-data-dir`, and `--enable-plugin` flags as needed
   - **cx_Freeze:** Generate a `setup.py` with `build_exe` options including packages, includes, and include_files

4. **Ensure accessibility resources are included:**
   - wxPython: include the wx locale and accessibility DLLs
   - PyQt/PySide: include the accessibility plugin (`accessible/`) from Qt plugins
   - Verify screen reader interop libraries are bundled (e.g., `UIAutomationClient`, `Accessible`)
   - Include any `.mo` locale files for internationalization

5. **Build the executable:**
   - Run the build command and capture output
   - Check for missing module warnings and resolve them
   - Verify the output executable launches correctly

6. **Verify the built application:**
   - Check the output directory size is reasonable
   - Confirm the executable runs without import errors
   - If a UI framework is present, confirm the window appears
   - Note any accessibility smoke test the user should run manually
