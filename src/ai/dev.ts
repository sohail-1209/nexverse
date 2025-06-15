
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-answer-summary.ts';
import '@/ai/flows/improve-answer.ts';
import '@/ai/flows/general-chat-flow.ts';
import '@/ai/flows/chat-with-image-flow.ts'; // Added new chat with image flow
import '@/ai/flows/generate-image-flow.ts'; // Added new image generation flow
