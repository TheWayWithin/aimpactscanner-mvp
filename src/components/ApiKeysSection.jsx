import React, { useState, useEffect, useCallback } from 'react';
import { createApiKey, listApiKeys, revokeApiKey } from '../lib/railwayApi';

const ApiKeysSection = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [revoking, setRevoking] = useState(null);

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listApiKeys();
      setKeys(data.keys || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;

    try {
      setCreating(true);
      setError(null);
      const data = await createApiKey(newKeyName.trim());
      setNewKeyValue(data.key);
      setNewKeyName('');
      await fetchKeys();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id, name) => {
    if (!window.confirm(`Revoke API key "${name}"? This cannot be undone.`)) return;

    try {
      setRevoking(id);
      setError(null);
      await revokeApiKey(id);
      await fetchKeys();
    } catch (err) {
      setError(err.message);
    } finally {
      setRevoking(null);
    }
  };

  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeKeys = keys.filter(k => k.is_active);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">API Keys</h2>
        <button
          onClick={() => { setShowCreateModal(true); setNewKeyValue(null); setNewKeyName(''); }}
          disabled={activeKeys.length >= 10}
          className="px-3 py-1.5 bg-signal text-white text-sm rounded-lg hover:bg-signal disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Create Key
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Use API keys for programmatic access to AImpactScanner.{' '}
        <a href="/docs/api.html" className="text-signal hover:underline" target="_blank" rel="noopener noreferrer">
          View API docs
        </a>
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            {newKeyValue ? (
              // Show the new key
              <>
                <h3 className="text-lg font-semibold mb-2">Your New API Key</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-yellow-800 text-sm font-medium">
                    Save this key now. It will not be shown again.
                  </p>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2 mb-4">
                  <code className="flex-1 text-sm break-all font-mono">{newKeyValue}</code>
                  <button
                    onClick={() => handleCopy(newKeyValue)}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm whitespace-nowrap"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <button
                  onClick={() => { setShowCreateModal(false); setNewKeyValue(null); }}
                  className="w-full px-4 py-2 bg-signal text-white rounded-lg hover:bg-signal"
                >
                  Done
                </button>
              </>
            ) : (
              // Create form
              <>
                <h3 className="text-lg font-semibold mb-4">Create API Key</h3>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., CI Pipeline, My Script"
                  maxLength={64}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-signal focus:border-signal"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newKeyName.trim() || creating}
                    className="flex-1 px-4 py-2 bg-signal text-white rounded-lg hover:bg-signal disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Key List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading keys...</div>
      ) : keys.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No API keys yet.</p>
          <p className="text-sm mt-1">Create a key to start using the API programmatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className={`border rounded-lg p-3 ${key.is_active ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{key.name}</span>
                    {key.is_active ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">Active</span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700">Revoked</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 space-x-3">
                    <span><code>{key.key_prefix}...</code></span>
                    <span>Created {formatDate(key.created_at)}</span>
                    <span>Last used {formatDate(key.last_used_at)}</span>
                  </div>
                </div>
                {key.is_active && (
                  <button
                    onClick={() => handleRevoke(key.id, key.name)}
                    disabled={revoking === key.id}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200 disabled:opacity-50 ml-3"
                  >
                    {revoking === key.id ? 'Revoking...' : 'Revoke'}
                  </button>
                )}
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400 mt-2">
            {activeKeys.length}/10 active keys
          </p>
        </div>
      )}
    </div>
  );
};

export default ApiKeysSection;
