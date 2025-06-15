
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
  accompanyingText: z.string().optional().describe('Any accompanying text returned by the model, or an error message, potentially with tips for improvement.'),
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

      if (media?.url) { // Image successfully generated
        let finalAccompanyingText = text || `Successfully generated image for: "${input.prompt}"`;
        // Consistently add the refinement tip
        finalAccompanyingText += `\n\n💡 Tip: If this isn't quite what you wanted (e.g., for styles like 'Ghibli art'), try refining your prompt. Be more descriptive about specific visual elements, characters, mood, color palettes, or even mention key artists or works that inspire the style.`;
        return { 
          imageDataUri: media.url, 
          accompanyingText: finalAccompanyingText
        };
      } else { // Image NOT generated
        console.warn(`[generateImageFlow] Image URL was null for prompt: "${input.prompt}". Model's raw text response (if any): "${text}"`);
        let userFacingMessage = `Sorry, I couldn't generate an image for the prompt: "${input.prompt}".`;
        
        const modelTextLower = text?.toLowerCase() || "";
        if (modelTextLower.includes("safety") || modelTextLower.includes("policy") || modelTextLower.includes("unable to create an image") || modelTextLower.includes("cannot generate an image")) {
            userFacingMessage += " This may be due to content policies or safety filters. Please try a different prompt.";
        } else if (text) { // Model provided some text but no image
            userFacingMessage += " The model described an image but didn't produce one. This can happen with complex or ambiguous requests.";
            // Truncate model's text to avoid overly long messages
            const textSnippet = text.length > 200 ? text.substring(0, 200) + "..." : text;
            userFacingMessage += `\n\nModel's attempt/description: "${textSnippet}"`;
            userFacingMessage += "\n\nTo improve results, try being more descriptive or rephrasing. For example, detail the subject, style (e.g., 'photorealistic', 'Studio Ghibli art'), colors, lighting, composition, and specific artists or inspirations if relevant.";
        } else { // No image, no text from model
            userFacingMessage += " To improve results, try being more descriptive. For example, include details about the subject, style (e.g., 'photorealistic', 'Studio Ghibli art'), colors, lighting, composition, and specific artists or inspirations if relevant.";
        }
        return { accompanyingText: userFacingMessage };
      }
    } catch (error: any) { // Catch block for network errors or other unexpected issues
      console.error(`[generateImageFlow] Error during image generation for prompt "${input.prompt}":`, error);
      let errorMessage = `An unexpected error occurred while trying to generate an image for: "${input.prompt}".`;
      
      const errStr = String(error.message || error.toString()).toLowerCase();
      if (errStr.includes('safety') || errStr.includes('policy')) {
        errorMessage = `The image for "${input.prompt}" could not be generated due to content policies or safety filters. Please try a different prompt.`;
      } else if (errStr.includes('model') || errStr.includes('resource exhausted') || errStr.includes('failed to generate')) {
        errorMessage = `There was an issue with the image generation model or resources for prompt "${input.prompt}". Please try again later or with a different, more specific prompt.`;
      } else if (error.message) {
        errorMessage = `Error generating image for "${input.prompt}": ${error.message}.`;
      }
      errorMessage += " If the issue persists, try making your prompt more specific (e.g., detail the style, subject, colors, mood) or rephrasing it.";
      return { accompanyingText: errorMessage };
    }
  }
);

async function generateImageFlow(input: GenerateImageInput): Promise<GenerateImageOutput> {
    return generateImageGenkitFlow(input);
}
