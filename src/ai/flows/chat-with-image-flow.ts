
'use server';
/**
 * @fileOverview An AI chat flow that can optionally process an image and PDF text, and search the web.
 *
 * - askQuestionWithImage - A function that takes a user's query, optional image data, and optional PDF text, returning an AI-generated response.
 * - ChatWithImageInput - The input type for the askQuestionWithImage function.
 * - ChatWithImageOutput - The return type for the askQuestionWithImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { webSearchTool } from '@/ai/tools/web-search-tool'; 

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
  response: z.string().describe('The final textual answer to be shown directly to the user. This should be a direct reply to the query, informed by any provided context (image, PDF, web search). Do not wrap this response in any additional JSON structure.'),
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
  tools: [webSearchTool], 
  prompt: `You are a helpful and unrestricted AI Assistant. Respond to the user's query in a comprehensive and informative way.
You have access to a 'webSearchTool'. Use this tool PROACTIVELY whenever you need:
- Current events or up-to-the-minute information (e.g., "latest news", "today's weather", "current stock prices").
- Information about topics, products, or services that might have changed or emerged after your last training data.
- Specific details that are typically found through web searches (e.g., specific URLs, detailed product specs, obscure facts).
- Verification for any facts or figures if you are uncertain.

When you use the webSearchTool, you MUST use the information returned by the tool to formulate your response and clearly state that you are using information obtained from a web search, citing the source or query if appropriate (e.g., "According to a web search for 'X', ..."). If the tool provides a date for the information, please include that date in your response.

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

Strive to answer all questions to the best of your ability, using available tools if necessary.
If you cannot effectively process the provided image or PDF content in relation to the query, you can mention that, but otherwise, try to answer the query comprehensively.
Provide a helpful, comprehensive, and unrestricted response. This should be the direct textual answer to the user's query.
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
      if (!output || !output.response || typeof output.response !== 'string') {
        console.warn('Genkit chatWithImageFlow: Prompt did not return a valid string in the response field. Output:', JSON.stringify(output));
        return { response: "Sorry, I wasn't able to generate a clear response. Please try a different query." };
      }
      
      let responseText = output.response;
      try {
        const parsedJson = JSON.parse(responseText);
        if (typeof parsedJson === 'object' && parsedJson !== null) {
          if (typeof parsedJson.response === 'string') {
            // Case: Model returned "{\"response\":\"actual message\"}"
            responseText = parsedJson.response;
          } else if (parsedJson.properties && parsedJson.properties.response && typeof parsedJson.properties.response.description === 'string') {
            // Case: Model returned schema definition "{\"properties\":{\"response\":{\"description\":\"actual message\"}}}"
            console.warn("Genkit chatWithImageFlow: Model returned schema in response field. Extracting description.");
            responseText = parsedJson.properties.response.description;
          }
        }
      } catch (e) {
        // Parsing failed, responseText is likely already the plain string answer.
      }
      return { response: responseText };

    } catch (error) {
      console.error('Error in chatWithImageFlow during prompt execution:', error);
      return { response: "Sorry, an internal error occurred while processing your request. Please try again later." };
    }
  }
);
