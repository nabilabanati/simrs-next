/**
 * API Client with Error Handling
 * 
 * Handles:
 * - Session expiration (single session enforcement)
 * - Authentication errors (401, 403)
 * - Network errors
 * - Non-JSON responses (HTML redirects)
 * - Server errors (500, etc)
 */

interface ApiClientOptions extends RequestInit {
  skipAuth?: boolean; // For public endpoints like login
}

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

class ApiClientError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Main API client function
 */
export async function apiClient<T = any>(
  url: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      credentials: 'include', // Always include cookies for auth
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    // === HANDLE REDIRECTS ===
    // If redirected to login, session is invalid
    if (response.redirected && response.url.includes('/login')) {
      console.warn('🔒 Session expired - redirecting to login');
      handleSessionExpired('session_expired');
      throw new ApiClientError('Session expired', 401, 'SESSION_EXPIRED');
    }

    // === HANDLE HTTP ERRORS ===
    if (!response.ok) {
      return handleErrorResponse(response);
    }

    // === HANDLE RESPONSE ===
    return await handleSuccessResponse<T>(response);
  } catch (error) {
    // Network errors, parsing errors, etc
    if (error instanceof ApiClientError) {
      throw error;
    }

    console.error('❌ API Client Error:', error);
    throw new ApiClientError(
      'Network error or server unavailable',
      0,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Handle successful responses
 */
async function handleSuccessResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');

  // Check if response is JSON
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();

    // Handle API response format: { data, error }
    if (data.error) {
      throw new ApiClientError(data.error, response.status, 'API_ERROR');
    }

    // Return data directly if it exists, otherwise return whole response
    return (data.data !== undefined ? data.data : data) as T;
  }

  // Got HTML instead of JSON - probably a redirect we missed
  if (contentType && contentType.includes('text/html')) {
    console.warn('⚠️ Received HTML instead of JSON - session might be invalid');
    handleSessionExpired('invalid_response');
    throw new ApiClientError(
      'Invalid response format - session expired',
      401,
      'INVALID_RESPONSE'
    );
  }

  // For other content types, try to parse as text
  const text = await response.text();
  return text as unknown as T;
}

/**
 * Handle error responses (4xx, 5xx)
 */
async function handleErrorResponse(response: Response): Promise<never> {
  const contentType = response.headers.get('content-type');
  let errorMessage = `Request failed with status ${response.status}`;
  let errorCode = 'HTTP_ERROR';

  // Try to parse error message from JSON response
  if (contentType && contentType.includes('application/json')) {
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;

      // === DETECT SESSION TERMINATION ===
      // Check if error message indicates session was terminated by another login
      if (errorMessage.toLowerCase().includes('session has been terminated') ||
        errorMessage.toLowerCase().includes('session terminated')) {
        console.warn('🔒 Session terminated - user logged in from another device');
        handleSessionExpired('session_invalidated');
        errorCode = 'SESSION_TERMINATED';
        throw new ApiClientError(errorMessage, response.status, errorCode);
      }
    } catch (e) {
      // If it's our ApiClientError, re-throw it
      if (e instanceof ApiClientError) {
        throw e;
      }
      // Failed to parse error JSON, use default message
    }
  }

  // Handle specific status codes
  switch (response.status) {
    case 401:
      console.warn('🔒 Unauthorized - redirecting to login');
      handleSessionExpired('unauthorized');
      errorCode = 'UNAUTHORIZED';
      break;

    case 403:
      console.warn('🚫 Forbidden - insufficient permissions');
      errorMessage = 'You do not have permission to access this resource';
      errorCode = 'FORBIDDEN';
      break;

    case 404:
      errorMessage = 'Resource not found';
      errorCode = 'NOT_FOUND';
      break;

    case 500:
      errorMessage = 'Internal server error - please try again later';
      errorCode = 'SERVER_ERROR';
      break;

    case 503:
      errorMessage = 'Service temporarily unavailable';
      errorCode = 'SERVICE_UNAVAILABLE';
      break;
  }

  throw new ApiClientError(errorMessage, response.status, errorCode);
}

/**
 * Handle session expiration
 */
function handleSessionExpired(reason: string) {
  // Clear user data from localStorage
  if (typeof window !== 'undefined') {
    // Clear ALL auth data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.clear();

    // Get current path for redirect after login
    const currentPath = window.location.pathname;

    // Show toast notification
    const messages: Record<string, string> = {
      session_expired: 'Sesi Anda telah berakhir',
      session_invalidated: 'Anda telah login dari perangkat lain',
      unauthorized: 'Sesi Anda tidak valid',
      invalid_response: 'Terjadi kesalahan pada sesi Anda',
    };

    const message = messages[reason] || 'Sesi Anda tidak valid';

    // Show toast
    import('react-hot-toast').then(({ default: toast }) => {
      toast.error(`${message}. Silakan login kembali.`, {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#EF4444',
          color: '#fff',
          fontWeight: '600',
        },
      });
    });

    // Build login URL
    const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}&reason=${reason}`;

    // AGGRESSIVE REDIRECT - Multiple fallback methods
    setTimeout(() => {
      // Try window.location.replace first (prevents back button, forces reload)
      try {
        window.location.replace(loginUrl);
      } catch (e) {
        // Fallback to href
        window.location.href = loginUrl;
      }

      // Force reload if still on same page after 300ms
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.reload();
        }
      }, 300);
    }, 700); // 700ms delay to show toast
  }
}

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  get: <T = any>(url: string, options?: ApiClientOptions) =>
    apiClient<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, data?: any, options?: ApiClientOptions) =>
    apiClient<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(url: string, data?: any, options?: ApiClientOptions) =>
    apiClient<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(url: string, data?: any, options?: ApiClientOptions) =>
    apiClient<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(url: string, options?: ApiClientOptions) =>
    apiClient<T>(url, { ...options, method: 'DELETE' }),
};

export default api;
