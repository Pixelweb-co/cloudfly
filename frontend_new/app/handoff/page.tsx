import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface HandoffResponse {
  status: string;
  new_conversation_id: string;
  message: string;
}

const HandoffPage: React.FC = () => {
  const [conversationId, setConversationId] = useState('');
  const [targetAgentId, setTargetAgentId] = useState('');
  const [metadata, setMetadata] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: any = {
        conversation_id: conversationId,
        target_agent_id: targetAgentId,
      };
      if (metadata) {
        try {
          payload.metadata = JSON.parse(metadata);
        } catch {
          payload.metadata = { raw: metadata };
        }
      }
      const res = await axios.post<HandoffResponse>('/api/handoff', payload);
      setSuccess(res.data.message);
      // Optionally navigate to the new conversation view
      // router.push(`/conversation/${res.data.new_conversation_id}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 shadow-md p-6">
        <h1 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-100 text-center">
          Transferir conversación a otro agente IA
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="conversationId">
              ID de conversación
            </label>
            <input
              id="conversationId"
              type="text"
              required
              value={conversationId}
              onChange={(e) => setConversationId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="targetAgentId">
              ID del agente destino
            </label>
            <input
              id="targetAgentId"
              type="text"
              required
              value={targetAgentId}
              onChange={(e) => setTargetAgentId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="metadata">
              Metadatos (JSON opcional)
            </label>
            <textarea
              id="metadata"
              rows={3}
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              placeholder="{ \"key\": \"value\" }"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Transfiriendo...' : 'Transferir'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HandoffPage;
