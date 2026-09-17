'use client';
export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function DocumentReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editedData, setEditedData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/documents/${id}`)
      .then(res => res.json())
      .then(json => {
        setDoc(json.data);
        setEditedData(json.data.extractedData || {});
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/documents/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correctedData: editedData }),
      });
      if (res.ok) {
        router.push('/documents');
      } else {
        alert('Failed to save corrections');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading Document...</div>;
  if (!doc) return <div className="p-8">Document not found</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left side - Document Preview Placeholder */}
      <div className="w-1/2 p-4 flex flex-col border-r border-gray-200 bg-white">
        <h2 className="text-lg font-medium mb-4">{doc.title}</h2>
        <div className="flex-grow bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center text-gray-500 flex-col">
          <span>📄 Document Viewer Component</span>
          <span className="text-sm mt-2 text-gray-400">PDF / Image preview goes here</span>
        </div>
      </div>

      {/* Right side - Extraction Panel */}
      <div className="w-1/2 p-4 flex flex-col bg-white overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">Extracted Data</h2>
          <div className="flex space-x-2">
            <span className={`px-2 py-1 text-xs rounded font-medium ${doc.confidence > 0.8 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Confidence: {Math.round(doc.confidence * 100)}%
            </span>
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded font-medium">
              {doc.documentType}
            </span>
          </div>
        </div>

        {doc.processingError && (
          <div className="mb-6 bg-red-50 p-4 rounded-md border border-red-200">
            <h3 className="text-sm font-medium text-red-800">Validation Issue</h3>
            <p className="text-sm text-red-700 mt-1">{doc.processingError}</p>
          </div>
        )}

        <div className="space-y-4 mb-8">
          {Object.entries(editedData).map(([key, value]) => {
            if (typeof value === 'object' && value !== null) return null; // Skip complex objects like lineItems for simple view
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
                <input
                  type="text"
                  value={value as string}
                  onChange={(e) => setEditedData({ ...editedData, [key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-6 border-t border-gray-200 flex space-x-4">
          <button 
            onClick={() => router.push('/documents')}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 flex-1"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 flex-1 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Approve & Extract'}
          </button>
        </div>
      </div>
    </div>
  );
}
