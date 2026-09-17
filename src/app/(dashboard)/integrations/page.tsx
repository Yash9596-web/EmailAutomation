'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function IntegrationHubPage() {
  const [data, setData] = useState<any>({ providers: [], connected: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/integrations')
      .then(res => res.json())
      .then(json => {
        setData(json.data || { providers: [], connected: [] });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading Integration Hub...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integration Hub</h1>
          <p className="text-gray-500 mt-2">Connect external systems to your automation platform.</p>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Active Connections</h2>
        {data.connected.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
            No active integrations. Choose a provider from the catalog below to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.connected.map((integration: any) => (
              <div key={integration.id} className="border border-gray-200 bg-white rounded-lg p-6 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium">{integration.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${integration.status === 'CONNECTED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {integration.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4 flex-grow">Type: {integration.type}</p>
                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {integration.lastConnectedAt ? `Last active: ${new Date(integration.lastConnectedAt).toLocaleDateString()}` : 'Never connected'}
                  </span>
                  <Link href={`/integrations/${integration.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Manage &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Integration Catalog</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.providers.map((provider: any) => (
            <div key={provider.id} className="border border-gray-200 bg-white rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center mb-4 text-xl">
                🔌
              </div>
              <h3 className="text-lg font-medium mb-1">{provider.displayName}</h3>
              <p className="text-sm text-gray-500 mb-4 h-10 overflow-hidden">{provider.category} integration via {provider.authMethod}</p>
              
              <div className="flex flex-wrap gap-1 mb-6 h-12 overflow-hidden">
                {provider.capabilities.slice(0,3).map((cap: string) => (
                  <span key={cap} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                    {cap}
                  </span>
                ))}
                {provider.capabilities.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">+{provider.capabilities.length - 3}</span>
                )}
              </div>

              <button 
                className="w-full py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                onClick={() => {
                  if (provider.authMethod === 'OAUTH2') {
                    window.location.href = `/api/v1/integrations/oauth/start?provider=${provider.id}&redirectUri=${encodeURIComponent(window.location.origin + '/api/v1/integrations/oauth/callback')}`;
                  } else {
                    alert('Manual configuration wizard coming soon for API key integrations.');
                  }
                }}
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
