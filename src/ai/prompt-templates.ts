// ✅ src/ai/prompt-templates.ts
type TemplateContext = {
  input: string;
  userContext?: Record<string, any>;
  memory?: string[];
};

export function loadPromptTemplates(intent: string, ctx: TemplateContext): string {
  const contextBlock = `
User Context:
${JSON.stringify(ctx.userContext ?? {}, null, 2)}

Relevant Memories:
${(ctx.memory ?? []).join("\n---\n")}

User Input:
${ctx.input}
`;

  switch (intent) {
    case "daily_review":
      return `${contextBlock}\n\nYou are a reflective assistant. Summarize the user's day, detect themes, and suggest focus for tomorrow.`;
    case "goal_update":
      return `${contextBlock}\n\nAnalyze the user's progress on their goals and recommend next actions.`;
    default:
      return `${contextBlock}\n\nRespond helpfully and insightfully.`;
  }
}
