import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export interface AppError {
  message: string;
  code?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: string;
  timestamp: number;
}

interface UseErrorHandlerReturn {
  error: AppError | null;
  isLoading: boolean;
  handleError: (error: any, context?: string) => void;
  clearError: () => void;
  executeWithErrorHandling: <T>(
    fn: () => Promise<T> | T,
    context?: string,
    options?: {
      showAlert?: boolean;
      logError?: boolean;
    }
  ) => Promise<T | null>;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const determineErrorSeverity = (error: any): AppError['severity'] => {
    if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
      return 'medium';
    }
    if (error?.name === 'DatabaseError' || error?.code === 'DB_ERROR') {
      return 'high';
    }
    if (error?.name === 'SecurityError' || error?.code === 'AUTH_ERROR') {
      return 'critical';
    }
    return 'low';
  };

  const formatErrorMessage = (error: any): string => {
    if (typeof error === 'string') {
      return error;
    }
    if (error?.message) {
      return error.message;
    }
    if (error?.error) {
      return error.error;
    }
    return 'An unexpected error occurred';
  };

  const logError = (appError: AppError) => {
    console.error('Error logged:', {
      message: appError.message,
      code: appError.code,
      severity: appError.severity,
      context: appError.context,
      timestamp: new Date(appError.timestamp).toISOString(),
    });
    
    // In a real app, send to crash reporting service
    // crashlytics().recordError(new Error(appError.message));
  };

  const handleError = useCallback((error: any, context?: string) => {
    const appError: AppError = {
      message: formatErrorMessage(error),
      code: error?.code || error?.name,
      severity: determineErrorSeverity(error),
      context,
      timestamp: Date.now(),
    };

    setError(appError);
    logError(appError);

    // Show alert for medium to critical errors
    if (appError.severity !== 'low') {
      const title = {
        medium: 'Connection Issue',
        high: 'Application Error',
        critical: 'Critical Error',
      }[appError.severity];

      const message = {
        medium: 'Please check your internet connection and try again.',
        high: 'Something went wrong. Please try again or restart the app.',
        critical: 'A critical error occurred. Please restart the app.',
      }[appError.severity];

      Alert.alert(title, `${message}\n\nError: ${appError.message}`, [
        { text: 'OK', onPress: () => setError(null) },
      ]);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const executeWithErrorHandling = useCallback(
    async <T>(
      fn: () => Promise<T> | T,
      context?: string,
      options: {
        showAlert?: boolean;
        logError?: boolean;
      } = {}
    ): Promise<T | null> => {
      const { showAlert = true, logError: shouldLog = true } = options;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await fn();
        return result;
      } catch (err) {
        const appError: AppError = {
          message: formatErrorMessage(err),
          code: err?.code || err?.name,
          severity: determineErrorSeverity(err),
          context,
          timestamp: Date.now(),
        };

        setError(appError);
        
        if (shouldLog) {
          logError(appError);
        }

        if (showAlert && appError.severity !== 'low') {
          Alert.alert(
            'Error',
            `${appError.message}${context ? ` (${context})` : ''}`,
            [{ text: 'OK' }]
          );
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    error,
    isLoading,
    handleError,
    clearError,
    executeWithErrorHandling,
  };
}

// Utility functions for common error scenarios
export const createNetworkError = (message = 'Network connection failed') => ({
  message,
  name: 'NetworkError',
  code: 'NETWORK_ERROR',
});

export const createDatabaseError = (message = 'Database operation failed') => ({
  message,
  name: 'DatabaseError',
  code: 'DB_ERROR',
});

export const createValidationError = (message = 'Invalid input provided') => ({
  message,
  name: 'ValidationError',
  code: 'VALIDATION_ERROR',
});

export const createAuthError = (message = 'Authentication failed') => ({
  message,
  name: 'SecurityError',
  code: 'AUTH_ERROR',
});