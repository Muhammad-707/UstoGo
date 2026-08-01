import ClientHomePage from './HomeClient';
import { getHomeData } from '@/lib/api/page-data';

export default async function HomePage() {
  const data = await getHomeData();
  return (
    <ClientHomePage categories={data.categories} topMasters={data.topMasters} allMasters={data.allMasters} />
  );
}
