import { serveAdminSpa } from '@/lib/spa-pages';
import AdminPageClient from '../AdminPageClient';
import QuotesDashboardClient from './QuotesDashboardClient';

export const dynamic = 'force-dynamic';

interface SearchParams {
  tab?: string;
}

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { tab } = await searchParams;
  if (tab === 'dashboard') {
    return <QuotesDashboardClient />;
  }
  const html = serveAdminSpa('quotes');
  return <AdminPageClient html={html} tab="quotes" />;
}
