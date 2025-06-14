
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-answer-summary.ts';
import '@/ai/flows/improve-answer.ts';
import '@/ai/flows/general-chat-flow.ts'; // Added new general chat flow
