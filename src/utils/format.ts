export function toBullet(content: string) {
    if (!content) {
        return content;
    }
    return content
        .split("\n")
        .map((line, index) => {
            if (index === 0) {
                return `- ${line}`;
            }
            return `  ${line}`;
        })
        .join("\n");
}
