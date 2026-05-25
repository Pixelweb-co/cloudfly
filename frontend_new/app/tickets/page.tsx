import React from 'react';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TicketsPage() {
  const { data, error, isLoading } = useSWR('/resolver/tickets', fetcher);

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 p-4">Failed to load tickets.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Pendientes Tickets</h1>
      <ul className="space-y-4">
        {data.map((ticket: any) => (
          <li key={ticket.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow">
            <Link href={ticket.url} target="_blank" className="text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline">
              {ticket.id}: {ticket.summary}
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Assignee: {ticket.assignee || 'Unassigned'} | Created: {new Date(ticket.created).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
