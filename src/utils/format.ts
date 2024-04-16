export function toBullet(content: string) {
    return content
        .split("\n")
        .map((line, index) => {
            if (index === 0) {
                return `- ${line}`;
            } else {
                return `  ${line}`;
            }
        })
        .join("\n");
}
