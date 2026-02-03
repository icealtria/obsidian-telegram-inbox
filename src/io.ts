import type { TFile, Vault } from "obsidian";

const FRONTMATTER_REGEX = /^---\n([\s\S]*?\n)---(\n|$)/;

function appendMessage(existingContent: string, message: string): string {
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
