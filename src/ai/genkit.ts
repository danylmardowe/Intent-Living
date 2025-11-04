import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// This configures the entire AI plugin for your application.
export const ai = genkit({
  plugins: [
    googleAI({
      // We are keeping the essential fix to force the stable v1 API endpoint.
      apiVersion: 'v1',
    }),
  ],
});