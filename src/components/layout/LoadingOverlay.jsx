import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingOverlay({ isLoading, message, details }) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {message || 'Calcolo in corso...'}
            </h3>
            {details && (
              <p className="text-sm text-gray-600">
                {details}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

