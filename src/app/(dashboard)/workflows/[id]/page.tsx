export const runtime = 'edge';
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function WorkflowBuilderPage() {
  const { id } = useParams();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'BUILDER' | 'MONITOR'>('BUILDER');

  useEffect(() => {
    fetch(`/api/v1/workflows/${id}`)
      .then(res => res.json())
      .then(json => {
        setWorkflow(json.data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-8">Loading Builder...</div>;
  if (!workflow) return <div className="p-8">Workflow not found</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{workflow.name} <span className="text-sm font-normal text-gray-500 ml-2">v{workflow.version}</span></h1>
          <div className="flex space-x-4 mt-2">
            <button 
              className={`text-sm font-medium pb-2 border-b-2 ${activeTab === 'BUILDER' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
              onClick={() => setActiveTab('BUILDER')}
            >
              Visual Builder
            </button>
            <button 
              className={`text-sm font-medium pb-2 border-b-2 ${activeTab === 'MONITOR' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
              onClick={() => setActiveTab('MONITOR')}
            >
              Execution Monitor
            </button>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium">Save Draft</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium shadow hover:bg-blue-700">Publish Version</button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Palette */}
        {activeTab === 'BUILDER' && (
          <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Triggers</h3>
            <NodeDraggable label="Event Trigger" icon="⚡" />
            <NodeDraggable label="Schedule" icon="⏱" />
            
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-4">Actions</h3>
            <NodeDraggable label="Create Transaction" icon="📝" />
            <NodeDraggable label="Send Email" icon="✉️" />
            <NodeDraggable label="AI Extraction" icon="🧠" />
            
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-4">Logic</h3>
            <NodeDraggable label="Condition Branch" icon="🔀" />
            <NodeDraggable label="Wait / Delay" icon="⏳" />
            <NodeDraggable label="Human Approval" icon="👤" />
          </div>
        )}

        {/* Center Canvas Workspace */}
        <div className="flex-1 relative bg-gray-100 overflow-hidden">
          {/* This is a placeholder for a true canvas library like React Flow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
            {activeTab === 'BUILDER' ? (
              <div className="text-center">
                <div className="text-6xl mb-4">🎨</div>
                <h2 className="text-xl font-medium text-gray-700">Visual Node Canvas</h2>
                <p className="text-gray-500">Drag and drop nodes here to construct the DAG.</p>
              </div>
            ) : (
              <div className="w-full h-full p-8 overflow-auto pointer-events-auto">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Execution History</h2>
                <table className="min-w-full bg-white rounded-lg shadow">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Run ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Mock execution logs */}
                    {workflow.runs?.map((run: any) => (
                      <tr key={run.id} className="border-t">
                        <td className="px-6 py-4 font-mono text-xs text-blue-600">{run.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(run.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full font-semibold ${run.status === 'Succeeded' ? 'bg-green-100 text-green-800' : run.status === 'Failed' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                            {run.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-500">1.2s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Configuration Panel */}
        {activeTab === 'BUILDER' && (
          <div className="w-80 bg-white border-l border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Node Configuration</h3>
            <div className="p-4 border border-dashed border-gray-300 rounded text-center text-sm text-gray-500">
              Select a node on the canvas to configure variables, AI prompts, or business logic.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NodeDraggable({ label, icon }: { label: string, icon: string }) {
  return (
    <div className="flex items-center p-3 mb-2 bg-white border border-gray-200 rounded shadow-sm cursor-grab hover:border-blue-400">
      <span className="text-xl mr-3">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
  );
}
