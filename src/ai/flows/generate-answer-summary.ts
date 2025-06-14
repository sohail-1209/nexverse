'use server';

/**
 * @fileOverview This file defines a Genkit flow for summarizing long answers.
 *
 * - summarizeAnswer - A function that summarizes a given answer.
 * - SummarizeAnswerInput - The input type for the summarizeAnswer function.
 * - SummarizeAnswerOutput - The output type for the summarizeAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeAnswerInputSchema = z.object({
  answer: z.string().describe('The full text of the answer to be summarized.'),
});
export type SummarizeAnswerInput = z.infer<typeof SummarizeAnswerInputSchema>;

const SummarizeAnswerOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the answer.'),
});
export type SummarizeAnswerOutput = z.infer<typeof SummarizeAnswerOutputSchema>;

export async function summarizeAnswer(input: SummarizeAnswerInput): Promise<SummarizeAnswerOutput> {
  return summarizeAnswerFlow(input);
}

const summarizeAnswerPrompt = ai.definePrompt({
  name: 'summarizeAnswerPrompt',
  input: {schema: SummarizeAnswerInputSchema},
  output: {schema: SummarizeAnswerOutputSchema},
  prompt: `Summarize the following answer in a concise manner, highlighting the key points:\n\n{{{answer}}}`,
});

const summarizeAnswerFlow = ai.defineFlow(
  {
    name: 'summarizeAnswerFlow',
    inputSchema: SummarizeAnswerInputSchema,
    outputSchema: SummarizeAnswerOutputSchema,
  },
  async input => {
    const {output} = await summarizeAnswerPrompt(input);
    return output!;
  }
);
