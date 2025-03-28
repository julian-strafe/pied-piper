# Pied Piper File Organizer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Node.js script to flatten a project's directory structure into a single folder, renaming files to include their original path. This is particularly useful for preparing a codebase for ingestion by Large Language Models (LLMs) that might have limitations with nested directories or require files individually.

## Problem Solved

LLMs often work best when provided with the full context of a project. However, uploading entire nested directory structures can be cumbersome or unsupported. `pied-piper.js` transforms your project into a flat list of files where each filename encodes its original location, making it easy to upload or process as a batch.

## How It Works

1.  **Clears/Creates Target Folder:** Deletes the contents of the configured `targetFolder` (default: `pipe/`) if it exists, or creates it if it doesn't. **Warning:** This is a destructive operation for the _target_ folder.
2.  **Scans Project:** Recursively scans the project directory from where the script is run.
3.  **Ignores Files/Folders:** Skips files, folders, and patterns specified in the configuration (`.piedpiper.json` or defaults). This typically includes `node_modules`, `.git`, lockfiles, build outputs, etc.
4.  **Copies & Renames:** Copies relevant files to the `targetFolder`.
    - Files are renamed using the convention: `folder_subfolder_filename.ext`.
    - Example: `./src/components/Button.jsx` becomes `src_components_Button.jsx`.
    - Files in the root directory keep their original names.
5.  **Appends `.txt`:** Appends a `.txt` extension to files whose original extensions are listed in `extensionsToAppendTxt` (e.g., `.jsx`, `.vue`, `.ts`) and to files that have no extension. This helps ensure they are treated as plain text. Example: `src_components_Button.jsx` might become `src_components_Button.jsx.txt`.
6.  **Filters (Optional):** If a command-line argument is provided, only files whose constructed path/name contain the argument (case-insensitive) are included.
7.  **Generates Internal README:** Creates a `README.md` _inside_ the `targetFolder` explaining the naming convention and listing the specific ignore rules used for that run.

## Features

- Flattens directory structure for easy LLM ingestion.
- Encodes original path into filenames.
- Highly configurable via `.piedpiper.json`.
- Sensible defaults for common web development projects.
- Optional filtering by path/filename.
- Appends `.txt` for better text compatibility.
- Clear logging output during processing.
- Cross-platform compatibility (uses Node.js `path` module).

## Requirements

- [Node.js](https://nodejs.org/) (developed with v18+, but likely compatible with older versions)

## Installation

1.  Clone this repository or download `pied-piper.js` and (optionally) `.piedpiper.json`.
2.  Place `pied-piper.js` in the root directory of the project you want to process.
3.  (Optional) Place `.piedpiper.json` in the same root directory to customize behavior. If not present, default settings within the script will be used.

## Usage

Navigate to your project's root directory in your terminal and run the script using Node.js:

```bash
# Run with default configuration (or .piedpiper.json if present)
node pied-piper.js

# Run with a filter (only include files whose path/name contains "component")
node pied-piper.js component
```

After execution, a folder named pipe (or your configured targetFolder) will be created (or cleared and refilled) in the project root, containing the flattened and renamed files.

## Configuration

Create a .piedpiper.json file in your project root to override the default settings.

Available Options:

- targetFolder (string): The directory where flattened files will be stored. Default: "pipe".
- ignoredFolders (string[]): List of directory names to ignore completely. Default: ["node_modules", "pipe", ".git", "dist"].
- ignoredFiles (string[]): List of specific filenames to ignore. Default: ["package-lock.json", "pied-piper.js", ".gitignore", ...].
- ignoredPatterns (string[]): List of glob-like patterns (currently supports _.extension) to ignore. Default: ["_.log", "_.cache", "_.svg"].
- extensionsToAppendTxt (string[]): List of file extensions that should have .txt appended to their name in the target folder. Also applies to files with no extension. Default: [".rules", ".jsx"] (Note: the provided .piedpiper.json in this repo has a more extensive list).

Example .piedpiper.json:

```json
{
  "targetFolder": "llm_context",
  "ignoredFolders": [
    "node_modules",
    ".git",
    "build",
    "dist",
    "coverage",
    ".vscode",
    "llm_context"
  ],
  "ignoredFiles": [
    "package-lock.json",
    "yarn.lock",
    "pied-piper.js",
    ".env",
    "my_secret_config.yaml"
  ],
  "ignoredPatterns": ["*.log", "*.tmp", "*.DS_Store", "*.swp"],
  "extensionsToAppendTxt": [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".css",
    ".scss",
    ".html",
    ".py",
    ".rb",
    ".java",
    ".md",
    ".rules"
  ]
}
```

# Warning ⚠️

This script deletes all contents of the specified targetFolder (default: pipe/) before running. Ensure that targetFolder does not point to a directory containing important data that is not part of the script's output.

### License

This project is licensed under the MIT License - see the LICENSE file for details.
