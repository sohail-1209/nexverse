
'use server';
/**
 * @fileOverview A general purpose AI chat flow that can optionally process text from a PDF.
 *
 * - askGeneralQuestion - A function that takes a user's query and optional PDF text, returning an AI-generated response.
 * - GeneralChatInput - The input type for the askGeneralQuestion function.
 * - GeneralChatOutput - The return type for the askGeneralQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneralChatInputSchema = z.object({
  query: z.string().describe('The user’s question or message.'),
  pdfTextContent: z.string().optional().describe('Text content extracted from an uploaded PDF file.'),
});
export type GeneralChatInput = z.infer<typeof GeneralChatInputSchema>;

const GeneralChatOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user’s query.'),
});
export type GeneralChatOutput = z.infer<typeof GeneralChatOutputSchema>;

export async function askGeneralQuestion(input: GeneralChatInput): Promise<GeneralChatOutput> {
  return generalChatFlow(input);
}

const commonSafetySettings = [
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
];

const prompt = ai.definePrompt({
  name: 'generalChatPrompt',
  input: {schema: GeneralChatInputSchema},
  output: {schema: GeneralChatOutputSchema},
  prompt: `You are a helpful AI Assistant. Respond to the user's query in a comprehensive and informative way.

User's query: {{{query}}}

{{#if pdfTextContent}}
The user has also provided the following text content from a PDF document. Use this content to inform your response if relevant to the query:
--- PDF START ---
{{{pdfTextContent}}}
--- PDF END ---
{{/if}}

Provide a helpful and concise response.
If the query is something you cannot assist with due to ethical or safety limitations, politely state that you cannot answer that specific type of question. However, aim to be as helpful as possible within safe boundaries.
`,
  config: {
    safetySettings: commonSafetySettings,
  },
});

const generalChatFlow = ai.defineFlow(
  {
    name: 'generalChatFlow',
    inputSchema: GeneralChatInputSchema,
    outputSchema: GeneralChatOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await prompt(input);
      if (!output || !output.response) {
        console.warn('Genkit generalChatFlow: Prompt did not return a valid output or response field.');
        return { response: "Sorry, I wasn't able to generate a clear response. Please try a different query." };
      }
      return output;
    } catch (error) {
      console.error('Error in generalChatFlow during prompt execution:', error);
      // Return a structured error response conforming to the output schema
      return { response: "Sorry, an internal error occurred while processing your request. Please try again later." };
    }
  }
);
