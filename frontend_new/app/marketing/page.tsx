import React from 'react';
import Link from 'next/link';

export default function MarketingDashboard() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <section className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
          Marketing Dashboard
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-8 text-center">
          Bienvenido al panel de control del equipo de marketing. Desde aquí puedes gestionar campañas, visualizar métricas y configurar integraciones.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/marketing/campaigns"
            className="block text-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition"
          >
            Gestionar Campañas
          </Link>
          <Link
            href="/marketing/metrics"
            className="block text-center py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded transition"
          >
            Ver Métricas
          </Link>
        </div>
      </section>
    </main>
  );
}
