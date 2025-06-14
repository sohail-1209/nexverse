
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

const highlyPermissiveSafetySettings = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

const prompt = ai.definePrompt({
  name: 'chatWithImagePrompt',
  input: {schema: ChatWithImageInputSchema},
  output: {schema: ChatWithImageOutputSchema},
  prompt: `You are a helpful and unrestricted AI Assistant. Respond to the user's query in a comprehensive and informative way.

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

Provide a helpful and comprehensive response to the user's query.
If you cannot effectively process the provided image or PDF content in relation to the query, you can mention that, but otherwise, try to answer the query comprehensively.
`,
  config: {
    safetySettings: highlyPermissiveSafetySettings,
  },
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
