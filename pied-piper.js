const fs = require('fs')
const path = require('path')

// Default configuration
const defaultConfig = {
  targetFolder: 'pipe',
  ignoredFolders: ['node_modules', 'pipe', '.git', 'dist'],
  ignoredFiles: [
    'package-lock.json',
    'organize.js',
    '.gitignore',
    '.prettierrc',
    '.env',
    'README.md',
    '.firebaserc',
  ],
  ignoredPatterns: ['*.log', '*.cache', '*.svg'],
  extensionsToAppendTxt: ['.rules', '.jsx'],
}

// Get filter argument if provided
const filterArg = process.argv[2]
if (filterArg) {
  console.log(`Filtering files containing: ${filterArg}`)
}

// Load configuration from .piedpiper.json if it exists
let config = { ...defaultConfig }
try {
  const configPath = path.join(process.cwd(), '.piedpiper.json')
  if (fs.existsSync(configPath)) {
    const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    config = {
      ...defaultConfig,
      ...userConfig,
    }
    console.log('Loaded configuration from .piedpiper.json')
  }
} catch (error) {
  console.error('Error loading .piedpiper.json:', error)
  console.log('Using default configuration')
}

// Function to clear the target folder
function clearTargetFolder() {
  if (fs.existsSync(config.targetFolder)) {
    console.log(`Clearing existing ${config.targetFolder} folder...`)
    const files = fs.readdirSync(config.targetFolder)
    for (const file of files) {
      const filePath = path.join(config.targetFolder, file)
      fs.unlinkSync(filePath)
      console.log(`Deleted: ${filePath}`)
    }
  } else {
    console.log(`Creating target folder: ${config.targetFolder}`)
    fs.mkdirSync(config.targetFolder)
  }
}

// Function to check if a filename matches an ignored pattern
function matchesIgnoredPattern(filename) {
  return config.ignoredPatterns.some((pattern) => {
    if (pattern.startsWith('*.')) {
      const extension = pattern.slice(1) // e.g., ".log"
      return filename.endsWith(extension)
    }
    return false
  })
}

// Function to check if a file matches the filter
function matchesFilter(filePath, relativePath) {
  if (!filterArg) return true
  const constructedName = relativePath
    .split(path.sep)
    .filter((part) => part.length > 0)
    .join('_')
  return constructedName.toLowerCase().includes(filterArg.toLowerCase())
}

// Function to create README.md in the pipe folder
function createReadme() {
  const readmeContent = `# Pipe Folder Overview

This folder contains a flattened version of a project directory structure, where all files have been copied from their original subdirectories into this single \`${
    config.targetFolder
  }\` folder. The purpose is to allow a Large Language Model (LLM) to ingest and understand the entire project structure in one shot by attaching these files.

## Naming Convention
- Each file is renamed to reflect its original folder path.
- Folder names are concatenated with underscores (\`_\`), followed by the original filename.
- Example: A file originally at \`./functions/fetchTournaments/fetchTournaments.js\` becomes \`functions_fetchTournaments_fetchTournaments.js\`.
- If a file was in the root directory, it retains its original name.
- Special cases:
  - Files with a \`.rules\` extension have \`.txt\` appended (e.g., \`myfile.rules\` becomes \`myfile.rules.txt\`).
  - Files with no extension have \`.txt\` appended (e.g., \`myfile\` becomes \`myfile.txt\`).

## Process
1. The script clears this \`${
    config.targetFolder
  }\` folder (if it exists) or creates it (if it doesn't).
2. It recursively crawls the parent directory, ignoring:
   - Folders: ${config.ignoredFolders.join(', ')}
   - Files: ${config.ignoredFiles.join(', ')}
   - Patterns: ${config.ignoredPatterns.join(', ')}
3. All other files are copied here with their new names, applying the extension rules above.
${
  filterArg
    ? `\n## Filter
Only files containing "${filterArg}" in their path were included.`
    : ''
}

## Usage
Attach all files in this folder to an LLM to provide a complete view of the project's codebase, with file paths embedded in the filenames for context.
`
  const readmePath = path.join(config.targetFolder, 'README.md')
  fs.writeFileSync(readmePath, readmeContent)
  console.log(`Created: ${readmePath}`)
}

// Function to process a directory
function processDirectory(currentDir, baseDir) {
  console.log(`Processing directory: ${currentDir}`)
  let items
  try {
    items = fs.readdirSync(currentDir)
  } catch (error) {
    console.error(`Error reading directory ${currentDir}:`, error)
    return
  }

  if (items.length === 0) {
    console.log(`No items found in ${currentDir}`)
  }

  for (const item of items) {
    const fullPath = path.join(currentDir, item)
    const relativePath = path.relative(baseDir, currentDir)
    let stat
    try {
      stat = fs.statSync(fullPath)
    } catch (error) {
      console.error(`Error getting stats for ${fullPath}:`, error)
      continue
    }

    // Skip ignored folders
    if (
      config.ignoredFolders.includes(item) ||
      config.ignoredFolders.some((ignored) => relativePath.startsWith(ignored))
    ) {
      console.log(`Skipping ignored folder: ${fullPath}`)
      continue
    }

    if (stat.isDirectory()) {
      // Recursively process subdirectories
      processDirectory(fullPath, baseDir)
    } else if (stat.isFile()) {
      // Skip ignored files or patterns
      if (config.ignoredFiles.includes(item) || matchesIgnoredPattern(item)) {
        console.log(`Skipping ignored file: ${fullPath}`)
        continue
      }

      // Check if file matches filter
      if (!matchesFilter(fullPath, relativePath)) {
        console.log(`Skipping file not matching filter: ${fullPath}`)
        continue
      }

      // Construct new filename
      const folderParts = relativePath
        .split(path.sep)
        .filter((part) => part.length > 0)
      const originalName = path.basename(item)
      let newName =
        folderParts.length > 0
          ? `${folderParts.join('_')}_${originalName}`
          : originalName

      // Handle special extension cases
      const ext = path.extname(newName)
      if (config.extensionsToAppendTxt.includes(ext)) {
        newName += '.txt' // Append .txt to specified extensions
      } else if (!ext) {
        newName += '.txt' // Append .txt to files with no extension
      }

      const targetPath = path.join(config.targetFolder, newName)

      // Copy file to target location
      try {
        fs.copyFileSync(fullPath, targetPath)
        console.log(`Copied: ${fullPath} -> ${targetPath}`)
      } catch (error) {
        console.error(`Error copying ${fullPath} to ${targetPath}:`, error)
      }
    }
  }
}

// Start processing
console.log('Starting file organization...')
try {
  clearTargetFolder() // Clear or create pipe folder first
  processDirectory('.', '.')
  createReadme() // Add README.md last
  console.log('File organization complete!')
} catch (error) {
  console.error('An unexpected error occurred:', error)
}
