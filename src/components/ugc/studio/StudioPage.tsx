import { useState, type ReactElement } from 'react';
import { SubTabs } from '../shared/primitives';
import { VideoAssistant } from './VideoAssistant';
import { IdeaBank } from './IdeaBank';
import { ScriptWriter } from './ScriptWriter';
import { ProductionBoard } from './ProductionBoard';
import { HookLibrary } from './HookLibrary';
import { Checklists } from './Checklists';

type StudioTab = 'video' | 'ideas' | 'scripts' | 'board' | 'hooks' | 'checklists';

interface Props { userId: string }

/** PILLAR 2 — Studio: video ingest/AI-tagging, ideation, scripting, production, hook library and checklists. */
export function StudioPage({ userId }: Props): ReactElement {
  const [tab, setTab] = useState<StudioTab>('video');
  return <div className="ugc-page">
    <SubTabs<StudioTab>
      active={tab}
      onChange={setTab}
      tabs={[
        { id: 'video', label: 'Video Assistant', icon: '🎬' },
        { id: 'ideas', label: 'Idea Bank', icon: '🌱' },
        { id: 'scripts', label: 'Script Writer', icon: '📝' },
        { id: 'board', label: 'Production Board', icon: '🗂️' },
        { id: 'hooks', label: 'Hook Library', icon: '🧲' },
        { id: 'checklists', label: 'Checklists', icon: '✅' },
      ]} />
    {tab === 'video' && <VideoAssistant userId={userId}/>}
    {tab === 'ideas' && <IdeaBank userId={userId}/>}
    {tab === 'scripts' && <ScriptWriter userId={userId}/>}
    {tab === 'board' && <ProductionBoard userId={userId}/>}
    {tab === 'hooks' && <HookLibrary userId={userId}/>}
    {tab === 'checklists' && <Checklists userId={userId}/>}
  </div>;
}