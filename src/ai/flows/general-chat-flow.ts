
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

const prompt = ai.definePrompt({
  name: 'generalChatPrompt',
  input: {schema: GeneralChatInputSchema},
  output: {schema: GeneralChatOutputSchema},
  prompt: `You are NExVERSE AI, a helpful assistant for students using the NExVERSE platform.
NExVERSE is a platform for sharing and discovering exam answers, study materials, and collaborating.
You can help with:
- Answering questions about exam topics.
- Summarizing content.
- Suggesting improvements for answers.
- General academic assistance related to exam preparation.

User's query: {{{query}}}

{{#if pdfTextContent}}
The user has also provided the following text content from a PDF document. Use this content to inform your response if relevant to the query:
--- PDF START ---
{{{pdfTextContent}}}
--- PDF END ---
{{/if}}

Provide a helpful and concise response.
If the query is outside your scope, or if you cannot process the provided PDF content effectively with the query, politely state that you cannot assist with that specific request or that part of the request.
`,
});

const generalChatFlow = ai.defineFlow(
  {
    name: 'generalChatFlow',
    inputSchema: GeneralChatInputSchema,
    outputSchema: GeneralChatOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      return { response: "Sorry, I wasn't able to generate a response. Please try again." };
    }
    return output;
  }
);
