'use server';

/**
 * @fileOverview An AI agent that improves a given answer to a question.
 *
 * - improveAnswer - A function that improves the given answer.
 * - ImproveAnswerInput - The input type for the improveAnswer function.
 * - ImproveAnswerOutput - The return type for the improveAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveAnswerInputSchema = z.object({
  question: z.string().describe('The question to be answered.'),
  answer: z.string().describe('The potentially incomplete answer.'),
});
export type ImproveAnswerInput = z.infer<typeof ImproveAnswerInputSchema>;

const ImproveAnswerOutputSchema = z.object({
  improvedAnswer: z.string().describe('The improved answer.'),
});
export type ImproveAnswerOutput = z.infer<typeof ImproveAnswerOutputSchema>;

export async function improveAnswer(input: ImproveAnswerInput): Promise<ImproveAnswerOutput> {
  return improveAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveAnswerPrompt',
  input: {schema: ImproveAnswerInputSchema},
  output: {schema: ImproveAnswerOutputSchema},
  prompt: `You are an expert educator. Improve the given answer to the question.

Question: {{{question}}}

Answer: {{{answer}}}

Improved Answer:`,
});

const improveAnswerFlow = ai.defineFlow(
  {
    name: 'improveAnswerFlow',
    inputSchema: ImproveAnswerInputSchema,
    outputSchema: ImproveAnswerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
