import type { TFile, Vault } from "obsidian";

export async function insertMessage(vault: Vault, message: string, tFile: TFile) {
  try {
    await vault.process(tFile, (data) => {
      const updatedContent = data.trim() === ""
        ? message
        : data.endsWith("\n")
          ? `${data}${message}`
          : `${data}\n${message}`;
      return updatedContent;
    });
  } catch (error) {
    throw new Error(`Error inserting message. ${error}`);
  }
}

export async function insertMessageAtTop(vault: Vault, message: string, tFile: TFile) {
  try {
    await vault.process(tFile, (data) => {
      const frontmatterMatch = data.match(/^---\n([\s\S]*?\n)---(\n|$)/);

      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[0];
        const contentAfterFrontmatter = data.slice(frontmatter.length);
        return `${frontmatter}${message}\n${contentAfterFrontmatter}`;
      } else {
        return `${message}\n${data}`;
      }
    });
  } catch (error) {
    throw new Error(`Error inserting message. ${error}`);
  }
}
