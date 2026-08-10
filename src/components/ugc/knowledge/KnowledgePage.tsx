import { useState, type ReactElement } from 'react';
import { SubTabs } from '../shared/primitives';
import { KnowledgeOverview } from './KnowledgeOverview';
import { KnowledgeBase } from './KnowledgeBase';
import { ContentPillars } from './ContentPillars';
import { GrowthAnalytics } from './GrowthAnalytics';
import { Goals } from './Goals';

type KnowledgeTab = 'overview' | 'base' | 'pillars' | 'analytics' | 'goals';

interface Props { userId: string }

/** PILLAR 4 — Knowledge: resources, content pillars, growth analytics and goals. */
export function KnowledgePage({ userId }: Props): ReactElement {
  const [tab, setTab] = useState<KnowledgeTab>('overview');
  return <div className="ugc-page">
    <SubTabs<KnowledgeTab>
      active={tab}
      onChange={setTab}
      tabs={[
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'base', label: 'Knowledge Base', icon: '📚' },
        { id: 'pillars', label: 'Content Pillars', icon: '🏛️' },
        { id: 'analytics', label: 'Growth Analytics', icon: '📈' },
        { id: 'goals', label: 'Goals', icon: '🎯' },
      ]} />
    {tab === 'overview' && <KnowledgeOverview userId={userId}/>}
    {tab === 'base' && <KnowledgeBase userId={userId}/>}
    {tab === 'pillars' && <ContentPillars userId={userId}/>}
    {tab === 'analytics' && <GrowthAnalytics userId={userId}/>}
    {tab === 'goals' && <Goals userId={userId}/>}
  </div>;
}