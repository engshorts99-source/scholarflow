import { Suspense } from 'react';
import ClientSearch from './ClientSearch';

export const runtime = 'edge';

export async function generateMetadata({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const q = searchParams.q as string;
  const type = searchParams.type as string;
  const titleSuffix = type === 'author' ? "Author Search" : "Paper Search";
  return {
    title: q ? `${q} - ScholarFlow ${titleSuffix}` : `Search - ScholarFlow`,
  };
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <ClientSearch />
    </Suspense>
  );
}
