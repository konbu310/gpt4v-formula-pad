import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: Bun.env["OPENAI_API_KEY"],
});

export async function toLatex(base64String: string): Promise<string> {
  const resp = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "system",
        content:
          "You are a machine that outputs LaTeX format strings from images with mathematical formulae; outputting non-LaTeX strings and delimiters is prohibited.",
      },
      {
        role: "user",
        content: [
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

  const message = resp.choices[0].message.content;

  if (!message) {
    throw new Error("Failed to convert image to LaTeX");
  }

  return message;
}
