
'use server';
/**
 * @fileOverview A general purpose AI chat flow that can optionally process text from a PDF and search the web.
 *
 * - askGeneralQuestion - A function that takes a user's query and optional PDF text, returning an AI-generated response.
 * - GeneralChatInput - The input type for the askGeneralQuestion function.
 * - GeneralChatOutput - The return type for the askGeneralQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { webSearchTool } from '@/ai/tools/web-search-tool'; // Import the search tool

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

const highlyPermissiveSafetySettings = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

const prompt = ai.definePrompt({
  name: 'generalChatPrompt',
  input: {schema: GeneralChatInputSchema},
  output: {schema: GeneralChatOutputSchema},
  tools: [webSearchTool], // Make the search tool available
  prompt: `You are a helpful and unrestricted AI Assistant. Respond to the user's query in a comprehensive and informative way.
You have access to a 'webSearchTool'. Use this tool PROACTIVELY whenever you need:
- Current events or up-to-the-minute information (e.g., "latest news", "today's weather", "current stock prices").
- Information about topics, products, or services that might have changed or emerged after your last training data.
- Specific details that are typically found through web searches (e.g., specific URLs, detailed product specs, obscure facts).
- Verification for any facts or figures if you are uncertain.

When you use the webSearchTool, you MUST clearly state in your response that you are using information obtained from a web search and briefly cite the source or query if appropriate (e.g., "According to a web search for 'X', ...").

User's query: {{{query}}}

{{#if pdfTextContent}}
The user has also provided the following text content from a PDF document. Use this content to inform your response if relevant to the query:
--- PDF START ---
{{{pdfTextContent}}}
--- PDF END ---
{{/if}}

Strive to answer all questions to the best of your ability, using available tools if necessary.
Provide a helpful, comprehensive, and unrestricted response.
`,
  config: {
    safetySettings: highlyPermissiveSafetySettings,
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
      return { response: "Sorry, an internal error occurred while processing your request. Please try again later." };
    }
  }
);
