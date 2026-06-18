/**
 * MCP response helpers.
 * Returns plain objects compatible with the MCP SDK's CallToolResult type.
 */

export function textResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function errorResult(
  error: string,
  message: string,
  meta?: Record<string, unknown>,
) {
  return {
    isError: true as const,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ error, message, ...meta }),
      },
    ],
  };
}
