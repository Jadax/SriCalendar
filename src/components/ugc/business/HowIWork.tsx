import { useMemo, type ReactElement } from 'react';
import { useCollection } from '../../../hooks/useCollection';
import { EmptyState, PageHead, Pill, SectionBlock } from '../shared/primitives';
import type { BoardCard } from '../../../types/ugc';

interface Props { userId: string }

interface WorkflowStep {
  id: string;
  label: string;
  icon: string;
  description: string;
  turnaround: string;
  boardColumn: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'strategy', label: 'Strategy', icon: '🎯', description: 'Brand call + ideation. Align on goals, audience, and creative direction.', turnaround: 'Day 1', boardColumn: 'idea' },
  { id: 'scripting', label: 'Scripting', icon: '📝', description: 'Script + storyboard. Hook, structure, and visual plan for brand approval.', turnaround: '1–2 days', boardColumn: 'scripting' },
  { id: 'preproduction', label: 'Pre-production', icon: '🎨', description: 'Shot list, wardrobe, locations. Everything ready before filming day.', turnaround: '1 day', boardColumn: 'preproduction' },
  { id: 'filming', label: 'Filming', icon: '🎬', description: 'Record raw clips. Multiple takes, angles, and B-roll for editing flexibility.', turnaround: '1 day', boardColumn: 'filming' },
  { id: 'editing', label: 'Editing', icon: '✂️', description: 'Cut, color grade, add text overlays and captions. Polish to final quality.', turnaround: '1–2 days', boardColumn: 'editing' },
  { id: 'review', label: 'Brand review', icon: '👀', description: 'First draft sent for feedback. One round of revisions included.', turnaround: '1 day', boardColumn: 'review' },
  { id: 'delivery', label: 'Delivery', icon: '📦', description: 'Final content delivered. Raw files + platform-optimized exports.', turnaround: 'Same day', boardColumn: 'scheduled' },
];

const COLUMN_TO_STEP: Record<string, string> = Object.fromEntries(WORKFLOW_STEPS.map((s) => [s.boardColumn, s.id]));

/** PILLAR 3 — How I Work: visual workflow timeline for brands (stolen from ugcbylinda.com). */
export function HowIWork({ userId }: Props): ReactElement {
  const { items: board } = useCollection('production_board', userId);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const card of board) {
      const stepId = COLUMN_TO_STEP[card.column_name] ?? 'other';
      counts[stepId] = (counts[stepId] || 0) + 1;
    }
    return counts;
  }, [board]);

  const totalPublished = board.filter((c: BoardCard) => c.column_name === 'published').length;
  const totalActive = board.filter((c: BoardCard) => !['published', 'repurposed'].includes(c.column_name)).length;
  const totalDeals = board.length;

  return <div className="ugc-page">
    <PageHead eyebrow="Business · Process" title="How I Work ⚙️"
      subtitle="Your production workflow — share this with brands to show how you operate." />

    <SectionBlock title="Workflow" hint="each step includes a turnaround time">
      <div className="workflow-timeline">
        {WORKFLOW_STEPS.map((step, i) => (
          <div key={step.id} className="workflow-step">
            <div className="workflow-step-marker">
              <span className="workflow-step-icon">{step.icon}</span>
              {i < WORKFLOW_STEPS.length - 1 && <div className="workflow-step-line" />}
            </div>
            <div className="workflow-step-body">
              <div className="workflow-step-header">
                <strong>{step.label}</strong>
                <Pill color="sky">{step.turnaround}</Pill>
              </div>
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, margin: '4px 0' }}>{step.description}</p>
              {(stats[step.id] ?? 0) > 0 && (
                <span className="hint" style={{ fontSize: 11.5 }}>{stats[step.id]} item{stats[step.id] !== 1 ? 's' : ''} here</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionBlock>

    <SectionBlock title="Turnaround estimate" hint="total time from first call to delivery">
      <div className="mini-grid">
        <div className="stat-card">
          <div className="stat-label">Typical turnaround</div>
          <div className="stat-value">5–7 days</div>
          <div className="stat-note">from strategy call to final delivery</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Revision rounds</div>
          <div className="stat-value">1 included</div>
          <div className="stat-note">extra rounds quoted separately</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Content published</div>
          <div className="stat-value">{totalPublished}</div>
          <div className="stat-note">pieces delivered to date</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Currently active</div>
          <div className="stat-value">{totalActive}</div>
          <div className="stat-note">items in your pipeline</div>
        </div>
      </div>
    </SectionBlock>

    <SectionBlock title="What brands get" hint="deliverables included in every project">
      <div className="grid grid-2" style={{ gap: 12 }}>
        {[
          { title: 'Raw + edited files', desc: 'Full-resolution raw clips plus platform-optimized exports (9:16, 1:1, 16:9).' },
          { title: 'Hook + caption', desc: 'Scroll-stopping opening hook and a platform-ready caption with hashtags.' },
          { title: 'Usage rights', desc: 'Organic posting rights included. Paid ad rights quoted separately.' },
          { title: 'Performance notes', desc: 'Post-delivery tips on posting time, hashtags, and engagement strategies.' },
        ].map((d) => (
          <div key={d.title} className="bs-option">
            <div className="bs-option-body">
              <strong style={{ fontSize: 14 }}>{d.title}</strong>
              <span className="muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>{d.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </SectionBlock>

    {board.length === 0 && (
      <SectionBlock title="Getting started">
        <EmptyState emoji="🚀" title="Your workflow is ready"
          note="As you move content through your Production Board, this page will show real-time stats — how many items are in each step, your average turnaround, and more." />
      </SectionBlock>
    )}
  </div>;
}
