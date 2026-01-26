/**
 * HTTP Client with Logging
 * Wraps the native fetch API to provide request and response logging
 */

interface FetchOptions extends RequestInit {
  // Add any custom options here if needed in the future
}

export const fetchWithLogging = async (url: string | URL, options: FetchOptions = {}): Promise<Response> => {
  const method = options.method || 'GET';
  const urlString = url.toString();

  // 1. Log Request
  console.log(`[EXTERNAL REQUEST] ${method} ${urlString}`);
  
  if (options.body) {
    try {
      // If body is a string, try to parse it as JSON for pretty logging
      // If it's not JSON, just log the string
      // If it's something else (FormData, Blob, etc), we might not be able to easy log it as text
      const bodyContent = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      console.log('[EXTERNAL REQUEST BODY]', JSON.stringify(bodyContent, null, 2));
    } catch (e) {
      // Not JSON or parsing failed, just log raw if it's a string
      if (typeof options.body === 'string') {
        console.log('[EXTERNAL REQUEST BODY]', options.body);
      } else {
        console.log('[EXTERNAL REQUEST BODY]', '(Body content not string)');
      }
    }
  }

  try {
    const response = await fetch(url, options);

    // 2. Log Response details
    console.log(`[EXTERNAL RESPONSE] ${response.status} ${urlString}`);

    // 3. Log Response Body
    // We must clone the response to read the body without consuming it for the caller
    const clonedResponse = response.clone();
    try {
      const text = await clonedResponse.text();
      try {
        const json = JSON.parse(text);
        console.log('[EXTERNAL RESPONSE BODY]', JSON.stringify(json, null, 2));
      } catch {
        console.log('[EXTERNAL RESPONSE BODY]', text.substring(0, 1000) + (text.length > 1000 ? '... (truncated)' : ''));
      }
    } catch (e) {
      console.log('[EXTERNAL RESPONSE BODY]', '(Failed to read response body)');
    }

    return response;
  } catch (error) {
    console.error(`[EXTERNAL REQUEST ERROR] ${method} ${urlString}`, error);
    throw error;
  }
};
