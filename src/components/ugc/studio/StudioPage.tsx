import { useState, type ReactElement } from 'react';
import { SubTabs } from '../shared/primitives';
import { VideoAssistant } from './VideoAssistant';
import { IdeaBank } from './IdeaBank';
import { ScriptWriter } from './ScriptWriter';
import { ProductionBoard } from './ProductionBoard';
import { HookLibrary } from './HookLibrary';
import { Checklists } from './Checklists';
import { TrendPulse } from './TrendPulse';
import { PortfolioGallery } from './PortfolioGallery';
import { PipelineView } from './PipelineView';
import { WeeklyPlanner } from './WeeklyPlanner';

type StudioTab = 'video' | 'ideas' | 'scripts' | 'board' | 'hooks' | 'checklists' | 'trends' | 'portfolio' | 'pipeline' | 'planner';

interface Props { userId: string }

/** PILLAR 2 — Studio: video ingest/AI-tagging, ideation, scripting, production, hook library, checklists, portfolio, pipeline, and weekly planner. */
export function StudioPage({ userId }: Props): ReactElement {
  const [tab, setTab] = useState<StudioTab>('pipeline');
  return <div className="ugc-page">
    <SubTabs<StudioTab>
      active={tab}
      onChange={setTab}
      tabs={[
        { id: 'pipeline', label: 'Pipeline', icon: '🔄' },
        { id: 'trends', label: 'Trend Pulse', icon: '🔥' },
        { id: 'planner', label: 'Weekly Plan', icon: '🗓️' },
        { id: 'ideas', label: 'Idea Bank', icon: '🌱' },
        { id: 'scripts', label: 'Script Writer', icon: '📝' },
        { id: 'video', label: 'Video Assistant', icon: '🎬' },
        { id: 'board', label: 'Production Board', icon: '🗂️' },
        { id: 'hooks', label: 'Hook Library', icon: '🧲' },
        { id: 'checklists', label: 'Checklists', icon: '✅' },
        { id: 'portfolio', label: 'Portfolio', icon: '✨' },
      ]} />
    {tab === 'pipeline' && <PipelineView userId={userId}/>}
    {tab === 'trends' && <TrendPulse userId={userId}/>}
    {tab === 'planner' && <WeeklyPlanner userId={userId}/>}
    {tab === 'ideas' && <IdeaBank userId={userId}/>}
    {tab === 'scripts' && <ScriptWriter userId={userId}/>}
    {tab === 'video' && <VideoAssistant userId={userId}/>}
    {tab === 'board' && <ProductionBoard userId={userId}/>}
    {tab === 'hooks' && <HookLibrary userId={userId}/>}
    {tab === 'checklists' && <Checklists userId={userId}/>}
    {tab === 'portfolio' && <PortfolioGallery userId={userId}/>}
  </div>;
}