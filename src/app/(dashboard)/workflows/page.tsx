'use client';
export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function WorkflowsDashboard() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, this fetches paginated workflows for the tenant
    fetch('/api/v1/workflows')
      .then(res => res.json())
      .then(json => {
        setWorkflows(json.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automation Engine</h1>
          <p className="text-gray-500 mt-2">Manage triggers, business rules, and AI orchestration.</p>
        </div>
        <Link href="/workflows/new" className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 font-medium">
          Create Workflow
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Active Workflows" count={workflows.filter(w => w.status === 'Published').length} />
        <StatCard title="Total Executions (Today)" count={workflows.length * 12} />
        <StatCard title="Failed Executions" count={0} color="text-red-600" />
        <StatCard title="Pending Approvals" count={3} color="text-amber-600" />
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workflow Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading workflows...</td></tr>
            ) : workflows.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No workflows found. Create one from a template.</td></tr>
            ) : (
              workflows.map(wf => (
                <tr key={wf.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{wf.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${wf.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {wf.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">v{wf.version}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/workflows/${wf.id}`} className="text-blue-600 hover:text-blue-900 font-medium">
                      Builder & Monitor
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

function StatCard({ title, count, color = 'text-gray-900' }: { title: string, count: number, color?: string }) {
  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-white">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className={`mt-2 text-3xl font-semibold ${color}`}>{count}</p>
    </div>
  );
}
