import OpenAI from "openai";
import type { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions";

const openai = new OpenAI({
  apiKey: Bun.env["OPENAI_API_KEY"],
});

export async function toLatex(
  base64String: string,
  model: ChatCompletionCreateParamsBase["model"] = "gpt-4o-mini",
  lang = "japanese",
): Promise<string> {
  const resp = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: String.raw`Convert the following handwritten equation to LaTeX format and return only the equation. Must not include delimiters like \[...\] or $...$. If you can't convert it, please return an error message in ${lang} starting with "ERROR:".`,
          },
          {
            type: "image_url",
            image_url: {
              url: `${base64String}`,
            },
          },
        ],
      },
    ],
  });

  return resp.choices[0].message.content ?? "";
}
