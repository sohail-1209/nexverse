
'use server';
/**
 * @fileOverview A Genkit flow for generating images based on a text prompt.
 *
 * - generateImage - A function that takes a text prompt and returns an image data URI.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageDataUri: z.string().optional().describe('The data URI of the generated image (e.g., data:image/png;base64,...).'),
  accompanyingText: z.string().optional().describe('Any accompanying text returned by the model, or an error message.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

// NOTE: Gemini 2.0 Flash for image generation is experimental.
// It might have stricter safety filters or limitations.
// Explicit safety settings can be added to `config` if needed,
// similar to text generation flows.
const generateImageGenkitFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    try {
      const {media, text} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: This model is for image generation
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE
        },
      });

      if (media?.url) {
        return { imageDataUri: media.url, accompanyingText: text || 'Image generated.' };
      } else {
        return { accompanyingText: text || 'Sorry, I could not generate an image for that prompt.' };
      }
    } catch (error: any) {
      console.error('Error in generateImageFlow:', error);
      let errorMessage = 'An unexpected error occurred while generating the image.';
      if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      if (error.cause?.message && error.cause.message.includes('SAFETY')) {
        errorMessage = "The image could not be generated due to safety filters. Please try a different prompt.";
      }
      return { accompanyingText: errorMessage };
    }
  }
);

// Wrapper function to match the naming convention if generateImageGenkitFlow is internal
async function generateImageFlow(input: GenerateImageInput): Promise<GenerateImageOutput> {
    return generateImageGenkitFlow(input);
}
