import React from 'react';
import Link from 'next/link';

export default function MetaDocsPage() {
  // Fetch the markdown file at build time (static generation)
  // In a real app, you might fetch from an API or import as raw text.
  const markdownUrl = '/marketing_agent/API_DOCUMENTATION.md';

  const [content, setContent] = React.useState<string>('Loading documentation...');

  React.useEffect(() => {
    fetch(markdownUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load documentation');
        return res.text();
      })
      .then((text) => setContent(text))
      .catch(() => setContent('Unable to load documentation.'));
  }, []);

  // Simple markdown renderer using a lightweight library (if available).
  // For this example, we will just render preformatted text.
  return (
    <section className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Meta Ads API Documentation
      </h1>
      <p className="mb-6 text-gray-700 dark:text-gray-300">
        Below is the generated API reference for Meta Ads integration. The content is pulled from the
        <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">marketing_agent/API_DOCUMENTATION.md</code>
        file in the repository.
      </p>
      <article className="prose prose-lg dark:prose-invert">
        <pre className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
          {content}
        </pre>
      </article>
      <div className="mt-8">
        <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">
          ← Back to Dashboard
        </Link>
      </div>
    </section>
  );
}
