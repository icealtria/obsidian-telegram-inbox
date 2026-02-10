import type { TFile, Vault } from "obsidian";

const FRONTMATTER_REGEX = /^---\n([\s\S]*?\n)---(\n|$)/;

export function appendMessage(existingContent: string, message: string): string {
  const trimmed = existingContent.trim();

  if (trimmed === "") {
    return message;
  }

  if (existingContent.endsWith("\n")) {
    return `${existingContent}${message}`;
  }

  return `${existingContent}\n${message}`;
}

export async function insertMessage(vault: Vault, message: string, tFile: TFile): Promise<void> {
  await vault.process(tFile, (data) => appendMessage(data, message));
}

export async function insertMessageAtTop(vault: Vault, message: string, tFile: TFile): Promise<void> {
  await vault.process(tFile, (data) => {
    const frontmatterMatch = data.match(FRONTMATTER_REGEX);

    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[0];
      const contentAfterFrontmatter = data.slice(frontmatter.length);
      return `${frontmatter}${message}\n${contentAfterFrontmatter}`;
    }

    return `${message}\n${data}`;
  });
}

export async function insertMessageAfterHeading(vault: Vault, message: string, tFile: TFile, heading: string): Promise<void> {
  await vault.process(tFile, (data) => {
    const lines = data.split('\n');
    const headingIndex = lines.findIndex(line => line.trim() === heading.trim());

    if (headingIndex !== -1) {
      lines.splice(headingIndex + 1, 0, message);
      return lines.join('\n');
    }

    // If heading doesn't exist, create it at the end
    let newData = data;
    if (data.length > 0) {
      if (!data.endsWith("\n")) {
        newData += "\n\n";
      } else if (!data.endsWith("\n\n")) {
        newData += "\n";
      }
    }

    return `${newData}${heading}\n${message}`;
  });
}
