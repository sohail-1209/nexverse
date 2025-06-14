
'use server';
/**
 * @fileOverview An AI chat flow that can optionally process an image along with a text query.
 *
 * - askQuestionWithImage - A function that takes a user's query and optional image data, returning an AI-generated response.
 * - ChatWithImageInput - The input type for the askQuestionWithImage function.
 * - ChatWithImageOutput - The return type for the askQuestionWithImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithImageInputSchema = z.object({
  query: z.string().describe('The user’s question or message.'),
  imageDataUri: z
    .string()
    .optional()
    .describe(
      "An image provided by the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  pdfTextContent: z.string().optional().describe('Text content extracted from an uploaded PDF file.'),
});
export type ChatWithImageInput = z.infer<typeof ChatWithImageInputSchema>;

const ChatWithImageOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user’s query.'),
});
export type ChatWithImageOutput = z.infer<typeof ChatWithImageOutputSchema>;

export async function askQuestionWithImage(input: ChatWithImageInput): Promise<ChatWithImageOutput> {
  return chatWithImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithImagePrompt',
  input: {schema: ChatWithImageInputSchema},
  output: {schema: ChatWithImageOutputSchema},
  prompt: `You are NExVERSE AI, a helpful assistant for students using the NExVERSE platform.
NExVERSE is a platform for sharing and discovering exam answers, study materials, and collaborating.
You can help with:
- Answering questions about exam topics.
- Summarizing content.
- Suggesting improvements for answers.
- General academic assistance related to exam preparation.
- If an image is provided, analyze the image in the context of the user's query.

User's query: {{{query}}}

{{#if imageDataUri}}
The user has also provided the following image. Use this image to inform your response if relevant to the query:
{{media url=imageDataUri}}
{{/if}}

{{#if pdfTextContent}}
The user has also provided the following text content from a PDF document. Use this content to inform your response if relevant to the query:
--- PDF START ---
{{{pdfTextContent}}}
--- PDF END ---
{{/if}}

Provide a helpful and concise response.
If the query is outside your scope, or if you cannot process the provided image/PDF content effectively with the query, politely state that you cannot assist with that specific request or that part of the request.
`,
});

const chatWithImageFlow = ai.defineFlow(
  {
    name: 'chatWithImageFlow',
    inputSchema: ChatWithImageInputSchema,
    outputSchema: ChatWithImageOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await prompt(input);
      if (!output || !output.response) {
        console.warn('Genkit chatWithImageFlow: Prompt did not return a valid output or response field.');
        return { response: "Sorry, I wasn't able to generate a clear response. Please try a different query." };
      }
      return output;
    } catch (error) {
      console.error('Error in chatWithImageFlow during prompt execution:', error);
      return { response: "Sorry, an internal error occurred while processing your request. Please try again later." };
    }
  }
);
