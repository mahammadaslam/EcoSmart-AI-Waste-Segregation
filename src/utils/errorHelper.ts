/**
 * Centralized Error translation and logging helper.
 * This ensures users never see technical details, stack traces, database exceptions,
 * or raw JSON payloads. Instead, they receive clear, professional, and friendly alerts.
 */

export interface FriendlyError {
  message: string;
  type: 'ai' | 'network' | 'camera' | 'location' | 'empty_centers' | 'server' | 'database' | 'generic';
}

export function translateError(err: any): FriendlyError {
  // Always log the detailed error in the console only for debugging
  console.group('Developer Diagnosis Log');
  console.error('Raw system error captured:', err);
  if (err && typeof err === 'object') {
    if (err.response) console.error('API Response Data:', err.response.data);
    if (err.stack) console.error('Stack Trace:', err.stack);
  }
  console.groupEnd();

  let errString = '';
  try {
    errString = err ? (typeof err === 'string' ? err : JSON.stringify(err)).toLowerCase() : '';
  } catch (stringifyError) {
    errString = `${err?.message || ''} ${err?.code || ''} ${err?.stack || ''}`.toLowerCase();
  }
  
  const message = err?.message?.toLowerCase() || '';

  let responseData = '';
  try {
    responseData = err?.response?.data ? (typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data)).toLowerCase() : '';
  } catch (e) {
    if (err?.response?.data && typeof err.response.data === 'object') {
      const dataObj = err.response.data;
      responseData = `${dataObj.error || dataObj.message || ''}`.toLowerCase();
    }
  }

  // 0. Priority: Specific Server API Response Data Errors
  if (err && typeof err === 'object' && err.response) {
    const status = err.response.status;
    const errorMsg = err.response.data?.error || err.response.data?.message;

    if (errorMsg && typeof errorMsg === 'string') {
      const lowerError = errorMsg.toLowerCase();

      // Check for backend AI / Gemini limits
      if (
        status === 429 ||
        lowerError.includes('quota') ||
        lowerError.includes('resource_exhausted') ||
        lowerError.includes('rate limit')
      ) {
        return {
          message: 'AI analysis is temporarily unavailable. Please try again later.',
          type: 'ai',
        };
      }

      // Check for backend high demand/temporary spike
      if (
        status === 503 ||
        lowerError.includes('unavailable') ||
        lowerError.includes('temporary spike')
      ) {
        return {
          message: 'AI analysis is temporarily unavailable. Please try again later.',
          type: 'ai',
        };
      }

      // Client-facing errors (< 500) from our own validation: email not found, incorrect password, mismatch
      if (status < 500) {
        return {
          message: errorMsg,
          type: 'generic',
        };
      }

      // Database/relational exception strings inside 5xx
      if (
        lowerError.includes('database') ||
        lowerError.includes('sql') ||
        lowerError.includes('relation') ||
        lowerError.includes('postgres') ||
        lowerError.includes('query')
      ) {
        return {
          message: "We're experiencing a temporary issue. Please try again later.",
          type: 'database',
        };
      }

      // Other 5xx issues
      return {
        message: 'Our services are temporarily unavailable. Please try again shortly.',
        type: 'server',
      };
    }
  }

  // 1. Quota / Rate-limit / Gemini API limits fallback (without response object)
  if (
    errString.includes('quota') ||
    errString.includes('resource_exhausted') ||
    errString.includes('rate limit') ||
    errString.includes('429') ||
    errString.includes('generativelanguage') ||
    responseData.includes('quota') ||
    responseData.includes('resource_exhausted') ||
    responseData.includes('429')
  ) {
    return {
      message: 'AI analysis is temporarily unavailable. Please try again later.',
      type: 'ai',
    };
  }

  // 2. Gemini High Demand / Model Unavailable / Temporary spike fallback
  if (
    errString.includes('503') ||
    errString.includes('unavailable') ||
    errString.includes('high demand') ||
    errString.includes('temporary spike') ||
    responseData.includes('503') ||
    responseData.includes('unavailable')
  ) {
    return {
      message: 'AI analysis is temporarily unavailable. Please try again later.',
      type: 'ai',
    };
  }

  // 3. Network Outage & Clean Timeout Separation
  // We only check for timeout in message if it doesn't just specify "timeout": 0 within a serialized axios config.
  const isNetworkError =
    err?.code === 'ERR_NETWORK' ||
    message === 'network error' ||
    errString.includes('network error') ||
    errString.includes('econnaborted') ||
    errString.includes('enotfound') ||
    errString.includes('failed to fetch') ||
    message.includes('fetch');

  const isTimeout =
    (message.includes('timeout') && !errString.includes('"timeout":0')) ||
    err?.code === 'ETIMEDOUT';

  if (isNetworkError || isTimeout) {
    return {
      message: 'Unable to connect to the server. Please check your internet connection.',
      type: 'network',
    };
  }

  // 4. Camera Permission Denied / Blocked / Lockout
  if (
    errString.includes('notallowederror') ||
    errString.includes('permissiondeniederror') ||
    errString.includes('camera permission') ||
    errString.includes('permission denied')
  ) {
    return {
      message: 'Camera access is required for live scanning. You can also upload an image instead.',
      type: 'camera',
    };
  }

  // 5. Geolocation / Location access denied/timer lockout
  if (
    errString.includes('geolocation') ||
    errString.includes('location position') ||
    errString.includes('user denied geolocation') ||
    errString.includes('location access is unavailable')
  ) {
    return {
      message: 'Location access is unavailable. Please search by city or pincode.',
      type: 'location',
    };
  }

  // 6. Database issues / relational failure fallback
  if (
    errString.includes('database') ||
    errString.includes('sql') ||
    errString.includes('postgres') ||
    errString.includes('query') ||
    errString.includes('db_cache') ||
    errString.includes('relation') ||
    responseData.includes('database') ||
    responseData.includes('sql')
  ) {
    return {
      message: "We're experiencing a temporary issue. Please try again later.",
      type: 'database',
    };
  }

  // 7. General Server 500 / gateway exceptions fallback
  if (
    errString.includes('500') ||
    errString.includes('502') ||
    errString.includes('504') ||
    errString.includes('internal server error') ||
    responseData.includes('500') ||
    responseData.includes('502') ||
    responseData.includes('504')
  ) {
    return {
      message: 'Our services are temporarily unavailable. Please try again shortly.',
      type: 'server',
    };
  }

  // 8. Default fallback
  return {
    message: "We're experiencing a temporary issue. Please try again later.",
    type: 'generic',
  };
}
