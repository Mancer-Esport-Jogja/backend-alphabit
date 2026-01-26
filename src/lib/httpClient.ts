/**
 * HTTP Client with Logging
 * Wraps the native fetch API to provide request and response logging
 */

import { getLogConfig, formatLogBody } from '../config/logging';

interface FetchOptions extends RequestInit {
  // Add any custom options here if needed in the future
}

export const fetchWithLogging = async (url: string | URL, options: FetchOptions = {}): Promise<Response> => {
  const method = options.method || 'GET';
  const urlString = url.toString();
  const config = await getLogConfig('external');

  // 1. Log Request
  if (config.enabled) {
      console.log(`[EXTERNAL REQUEST] ${method} ${urlString}`);
      
      if (config.body && options.body) {
        try {
          // If body is a string, try to parse it as JSON for pretty/minified logging
          const bodyContent = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
          const formattedBody = formatLogBody(bodyContent, config);
          console.log('[EXTERNAL REQUEST BODY]', formattedBody);
        } catch (e) {
          // Not JSON or parsing failed, just log raw if it's a string
          if (typeof options.body === 'string') {
              // Simple truncation for non-JSON strings
            if (options.body.length > config.maxBodyLength) {
                console.log('[EXTERNAL REQUEST BODY]', options.body.substring(0, config.maxBodyLength) + ' ... (truncated)');
            } else {
                console.log('[EXTERNAL REQUEST BODY]', options.body);
            }
          } else {
            console.log('[EXTERNAL REQUEST BODY]', '(Body content not string)');
          }
        }
      }
  }

  try {
    const response = await fetch(url, options);

    if (config.enabled) {
        // 2. Log Response details
        console.log(`[EXTERNAL RESPONSE] ${response.status} ${urlString}`);

        // 3. Log Response Body
        if (config.body) {
            // We must clone the response to read the body without consuming it for the caller
            const clonedResponse = response.clone();
            try {
            const text = await clonedResponse.text();
            try {
                const json = JSON.parse(text);
                const formattedBody = formatLogBody(json, config);
                console.log('[EXTERNAL RESPONSE BODY]', formattedBody);
            } catch {
                if (text.length > config.maxBodyLength) {
                    console.log('[EXTERNAL RESPONSE BODY]', text.substring(0, config.maxBodyLength) + '... (truncated)');
                } else {
                    console.log('[EXTERNAL RESPONSE BODY]', text);
                }
            }
            } catch (e) {
            console.log('[EXTERNAL RESPONSE BODY]', '(Failed to read response body)');
            }
        }
    }

    return response;
  } catch (error) {
    console.error(`[EXTERNAL REQUEST ERROR] ${method} ${urlString}`, error);
    throw error;
  }
};
