import { useState, type ReactElement } from 'react';
import { SubTabs } from '../shared/primitives';
import { BusinessDashboard } from './BusinessDashboard';
import { BrandDeals } from './BrandDeals';
import { Invoices } from './Invoices';
import { MediaKit } from './MediaKit';
import { Collaborations } from './Collaborations';
import { Income } from './Income';
import { RateCalculator } from './RateCalculator';
import { HowIWork } from './HowIWork';

type BusinessTab = 'dashboard' | 'income' | 'deals' | 'rates' | 'invoices' | 'media' | 'collabs' | 'workflow';

interface Props { userId: string }

/** PILLAR 3 — Business: income, deals, pricing, invoices, media kit, partner management, and workflow. */
export function BusinessPage({ userId }: Props): ReactElement {
  const [tab, setTab] = useState<BusinessTab>('dashboard');
  return <div className="ugc-page">
    <SubTabs<BusinessTab>
      active={tab}
      onChange={setTab}
      tabs={[
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'income', label: 'Income', icon: '💗' },
        { id: 'deals', label: 'Brand Deals', icon: '🤝' },
        { id: 'rates', label: 'Rates', icon: '🧮' },
        { id: 'invoices', label: 'Invoices', icon: '🧾' },
        { id: 'media', label: 'Media Kit', icon: '📇' },
        { id: 'collabs', label: 'Collabs', icon: '✨' },
        { id: 'workflow', label: 'How I Work', icon: '⚙️' },
      ]} />
    {tab === 'dashboard' && <BusinessDashboard userId={userId}/>}
    {tab === 'income' && <Income userId={userId}/>}
    {tab === 'deals' && <BrandDeals userId={userId}/>}
    {tab === 'rates' && <RateCalculator userId={userId}/>}
    {tab === 'invoices' && <Invoices userId={userId}/>}
    {tab === 'media' && <MediaKit userId={userId}/>}
    {tab === 'collabs' && <Collaborations userId={userId}/>}
    {tab === 'workflow' && <HowIWork userId={userId}/>}
  </div>;
}