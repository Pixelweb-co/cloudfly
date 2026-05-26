import React from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TicketResolverPage() {
  const { data, error, isLoading } = useSWR('/ticket_resolver/tickets/pending', fetcher);

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 p-4">Failed to load tickets.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Pending Jira Tickets</h1>
      {data && data.length > 0 ? (
        <ul className="space-y-4">
          {data.map((ticket: any) => (
            <li key={ticket.key} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow">
              <a href={`${process.env.NEXT_PUBLIC_JIRA_URL}/browse/${ticket.key}`} target="_blank" rel="noopener noreferrer" className="text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline">
                {ticket.key}
              </a>
              <p className="text-gray-700 dark:text-gray-300 mt-1">{ticket.fields?.summary}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600 dark:text-gray-400">No pending tickets found.</p>
      )}
    </div>
  );
}
