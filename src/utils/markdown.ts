import { escapers, serialiseWith } from "@telegraf/entity";
import { Serialiser, Node } from "@telegraf/entity/types/types";
import { MessageUpdate, TGInboxSettings } from "src/type";

const markdownSerialiser: Serialiser = function (match: string, node?: Node) {
  switch (node?.type) {
    case "bold":
      return `**${match}**`;
    case "italic":
      return `*${match}*`;
    case "underline":
      return `<u>${match}</u>`;
    case "strikethrough":
      return `~~${match}~~`;
    case "code":
      return `\`${match}\``;
    case "pre":
      if (node.language) return "```" + node.language + "\n" + match + "\n```";
      return "```\n" + match + "\n```";
    case "spoiler":
      return `==${match}==`;
    case "url":
      return match;
    case "text_link":
      return `[${match}](${node.url})`;
    case "text_mention":
      return `[${match}](tg://user?id=${node.user.id})`;
    case "blockquote":
      return `${match
        .split("\n")
        .map((line) => `>${line}`)
        .join("\n")}`;
    case "mention":
    case "custom_emoji":
    case "hashtag":
    case "cashtag":
    case "bot_command":
    case "phone_number":
    case "email":
    default:
      return match;
  }
};

export function toMarkdownV2(msg: MessageUpdate, settings: TGInboxSettings): string {
  const selectedEscaper = settings.markdown_escaper ? escapers.MarkdownV2 : escapers.HTML;
  return serialiseWith(markdownSerialiser, selectedEscaper)(msg);
}