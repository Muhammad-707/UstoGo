import LandingClient from '@/components/landing/LandingClient';
import { getLandingData } from '@/lib/api/page-data';

export default async function LandingPage() {
  const data = await getLandingData();
  return (
    <LandingClient categories={data.categories} topMasters={data.topMasters} allMasters={data.allMasters} />
  );
}
