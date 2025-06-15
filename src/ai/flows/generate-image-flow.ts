
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

const highlyPermissiveSafetySettings = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

const generateImageGenkitFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    try {
      const {media, text} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', 
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], 
          safetySettings: highlyPermissiveSafetySettings,
        },
      });

      if (media?.url) {
        return { 
          imageDataUri: media.url, 
          accompanyingText: text || `Successfully generated image for: "${input.prompt}"` 
        };
      } else {
        // Image was not generated, media.url is null.
        console.warn(`[generateImageFlow] Image URL was null for prompt: "${input.prompt}". Model's raw text response (if any): "${text}"`);
        let userFacingMessage = `Sorry, I couldn't generate an image for the prompt: "${input.prompt}".`;
        
        if (text && (text.toLowerCase().includes("safety") || text.toLowerCase().includes("policy") || text.toLowerCase().includes("unable to create") || text.toLowerCase().includes("cannot generate"))) {
            userFacingMessage += " This may be due to content policies or safety filters. Please try a different prompt.";
        } else {
            userFacingMessage += " To improve results, try being more descriptive. For example, include details about the subject, style (e.g., 'photorealistic', 'cartoon'), colors, lighting, or composition.";
        }
        return { accompanyingText: userFacingMessage };
      }
    } catch (error: any) {
      console.error(`[generateImageFlow] Error during image generation for prompt "${input.prompt}":`, error);
      let errorMessage = `An unexpected error occurred while trying to generate an image for: "${input.prompt}".`;
      
      const errStr = String(error.message || error.toString()).toLowerCase();
      if (errStr.includes('safety') || errStr.includes('policy')) {
        errorMessage = `The image for "${input.prompt}" could not be generated due to content policies or safety filters. Please try a different prompt.`;
      } else if (errStr.includes('model') || errStr.includes('resource exhausted') || errStr.includes('failed to generate')) {
        errorMessage = `There was an issue with the image generation model or resources for prompt "${input.prompt}". Please try again later or with a different, more specific prompt.`;
      } else if (error.message) {
        errorMessage = `Error generating image for "${input.prompt}": ${error.message}. If the issue persists, try making your prompt more specific or rephrasing it.`;
      }
      return { accompanyingText: errorMessage };
    }
  }
);

async function generateImageFlow(input: GenerateImageInput): Promise<GenerateImageOutput> {
    return generateImageGenkitFlow(input);
}

