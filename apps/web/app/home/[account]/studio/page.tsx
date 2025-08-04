import React from 'react';
import Studio from './components/Studio';

export default function StudioPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Audience Studio</h1>
          <p className="text-gray-600 mt-2">
            Create sub-segments from your existing audiences using powerful filters
          </p>
        </div>
        <Studio />
      </div>
    </div>
  );
} 