#!/usr/bin/env bun

import { mkdir, readdir, copyFile, rename, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const purple: string = "\x1b[38;2;114;47;55m";
const dim: string = "\x1b[2m";
const green: string = "\x1b[38;2;80;200;120m";
const red: string = "\x1b[38;2;220;50;50m";
const reset: string = "\x1b[0m";

/**
 * Recursively copies a directory. Files prefixed with `_` are renamed on copy
 * (`_gitignore` becomes `.gitignore`) because npm strips dotfiles from published
 * packages.
 */
const copyDir = async (from: string, to: string): Promise<void> => {
  await mkdir(to, { recursive: true });

  const entries: string[] = await readdir(from);

  for (const entry of entries) {
    const source: string = join(from, entry);
    const target: string = join(to, entry.startsWith("_") ? `.${entry.slice(1)}` : entry);

    const info = await stat(source);

    if (info.isDirectory()) {
      await copyDir(source, target);
      continue;
    }

    await copyFile(source, target);
  }
};

/**
 * Rewrites the generated package.json so its `name` matches the target folder.
 */
const setProjectName = async (projectDir: string, name: string): Promise<void> => {
  const manifestPath: string = join(projectDir, "package.json");
  const manifest = await Bun.file(manifestPath).json();

  manifest.name = name;

  await Bun.write(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
};

const fail = (message: string): never => {
  console.error(`\n${red}✗ ${message}${reset}\n`);
  process.exit(1);
};

const main = async (): Promise<void> => {
  const target: string | undefined = process.argv[2];

  if (!target) {
    fail("Missing project name.\n\n  Usage: bun create clairex <project-name>");
  }

  const projectDir: string = resolve(process.cwd(), target as string);
  const projectName: string = basename(projectDir);

  if (existsSync(projectDir)) {
    const contents: string[] = await readdir(projectDir);
    if (contents.length > 0) {
      fail(`Directory "${projectName}" already exists and is not empty.`);
    }
  }

  const templateDir: string = join(dirname(fileURLToPath(import.meta.url)), "template");

  if (!existsSync(templateDir)) {
    fail("Template directory not found. This is a bug in create-clairex.");
  }

  console.log(`\n${purple}  Creating ClaireX project in ${projectName}...${reset}`);

  await copyDir(templateDir, projectDir);
  await setProjectName(projectDir, projectName);

  console.log(`
${green}  ✓ Done!${reset}

${dim}  Next steps:${reset}

    cd ${target}
    bun install
    bun dev

${dim}  Your API will be running on http://localhost:3000${reset}
${dim}  Try: curl http://localhost:3000/users${reset}
`);
};

main();
