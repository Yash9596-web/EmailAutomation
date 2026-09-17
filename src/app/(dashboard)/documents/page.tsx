'use client';
export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DocumentWorkspacePage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    // In production, this would be a paginated /api/v1/documents call
    fetch('/api/v1/documents')
      .then(res => res.json())
      .then(json => {
        setDocuments(json.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filtered = filter === 'ALL' ? documents : documents.filter(d => d.status === filter);

  const stats = {
    total: documents.length,
    review: documents.filter(d => d.status === 'REVIEW_REQUIRED').length,
    processing: documents.filter(d => d.status === 'PROCESSING' || d.status === 'QUEUED').length,
    failed: documents.filter(d => d.status === 'FAILED').length,
    completed: documents.filter(d => d.status === 'COMPLETED').length,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Workspace</h1>
          <p className="text-gray-500 mt-2">Manage incoming business documents and extraction pipelines.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 font-medium">
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <StatCard title="Total" count={stats.total} active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
        <StatCard title="Needs Review" count={stats.review} active={filter === 'REVIEW_REQUIRED'} onClick={() => setFilter('REVIEW_REQUIRED')} color="text-amber-600" />
        <StatCard title="Processing" count={stats.processing} active={filter === 'PROCESSING'} onClick={() => setFilter('PROCESSING')} color="text-blue-600" />
        <StatCard title="Failed" count={stats.failed} active={filter === 'FAILED'} onClick={() => setFilter('FAILED')} color="text-red-600" />
        <StatCard title="Completed" count={stats.completed} active={filter === 'COMPLETED'} onClick={() => setFilter('COMPLETED')} color="text-green-600" />
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading documents...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No documents found matching criteria.</td></tr>
            ) : (
              filtered.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{doc.title}</div>
                    <div className="text-sm text-gray-500">{doc.source}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.documentType || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/documents/${doc.id}`} className="text-blue-600 hover:text-blue-900">
                      {doc.status === 'REVIEW_REQUIRED' ? 'Review' : 'View'}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ title, count, active, onClick, color = 'text-gray-900' }: any) {
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-colors ${active ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 bg-white hover:border-gray-300'}`}
    >
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className={`mt-2 text-3xl font-semibold ${color}`}>{count}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'RECEIVED': 'bg-gray-100 text-gray-800',
    'QUEUED': 'bg-gray-100 text-gray-800',
    'PROCESSING': 'bg-blue-100 text-blue-800',
    'EXTRACTING': 'bg-blue-100 text-blue-800',
    'VALIDATING_DATA': 'bg-purple-100 text-purple-800',
    'REVIEW_REQUIRED': 'bg-amber-100 text-amber-800',
    'COMPLETED': 'bg-green-100 text-green-800',
    'FAILED': 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}
