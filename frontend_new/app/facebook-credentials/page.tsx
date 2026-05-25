import React, { useState, useEffect } from 'react';
import Head from 'next/head';

const FacebookCredentialsPage: React.FC = () => {
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [saved, setSaved] = useState(false);

  // Load existing values from localStorage (multi‑tenant isolation can be handled by prefixing keys)
  useEffect(() => {
    const tenant = localStorage.getItem('activeTenantId') || 'default';
    setAppId(localStorage.getItem(`${tenant}_FB_APP_ID`) || '');
    setAppSecret(localStorage.getItem(`${tenant}_FB_APP_SECRET`) || '');
    setAccessToken(localStorage.getItem(`${tenant}_FB_ACCESS_TOKEN`) || '');
    setPageId(localStorage.getItem(`${tenant}_FB_PAGE_ID`) || '');
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const tenant = localStorage.getItem('activeTenantId') || 'default';
    localStorage.setItem(`${tenant}_FB_APP_ID`, appId.trim());
    localStorage.setItem(`${tenant}_FB_APP_SECRET`, appSecret.trim());
    localStorage.setItem(`${tenant}_FB_ACCESS_TOKEN`, accessToken.trim());
    localStorage.setItem(`${tenant}_FB_PAGE_ID`, pageId.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      <Head>
        <title>Facebook API Credentials</title>
      </Head>
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Configuración de Credenciales de Facebook
        </h1>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="appId">
              App ID
            </label>
            <input
              id="appId"
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="appSecret">
              App Secret
            </label>
            <input
              id="appSecret"
              type="password"
              value={appSecret}
              onChange={(e) => setAppSecret(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="accessToken">
              Access Token
            </label>
            <input
              id="accessToken"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="pageId">
              Page ID
            </label>
            <input
              id="pageId"
              type="text"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition-colors"
          >
            Guardar Credenciales
          </button>
          {saved && (
            <p className="mt-2 text-green-600 dark:text-green-400">Credenciales guardadas correctamente.</p>
          )}
        </form>
      </main>
    </>
  );
};

export default FacebookCredentialsPage;
