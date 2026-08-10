import type { ChecklistItem } from '../types/ugc';

export interface ChecklistPreset { name: string; category: string; items: string[] }

export const CHECKLIST_PRESETS: ChecklistPreset[] = [
  {
    name: 'Indoor Shoot · Lighting', category: 'lighting',
    items: [
      'Key light at 45° above eye line', 'Fill light softened with diffusion', 'Backlight/hair light separates subject', 'Bounce for shadows', 'Color temperature matched across lights', 'Practical lights add depth in frame', 'Lighting test shots before recording', 'No harsh overhead shadows',
    ],
  },
  {
    name: 'Indoor Shoot · Audio', category: 'audio',
    items: [
      'Mic battery full', 'Record a 10s room-tone sample', 'Set gain peaking −6 dB', 'Check for fridge/AC hum', 'Pop filter / windscreen on', 'Lav mic hidden or framed out', 'Headphone monitoring during take', 'Backup mic rolling on phone',
    ],
  },
  {
    name: 'Outdoor / Golden Hour', category: 'lighting',
    items: [
      'Sun behind subject for halo effect', 'Scout location 24h ahead', 'Backup indoor location if weather flips', 'Polarizer for sky punch', 'Shade for midday control', 'Golden hour window: 60 min', 'Lens cloth for moisture', 'Phone battery + power bank',
    ],
  },
  {
    name: 'Brand Requirements', category: 'brand',
    items: [
      'Deliverable list confirmed vs contract', 'Usage-rights wording pulled for invoice', 'Brand assets: logo, colors, fonts, references', 'Logo on file + clearance granted', 'Mention format approved (script + caption)', 'Disclosure: #ad / paid partnership label', 'Scheduling/approval deadline mapped', 'No unapproved competitor mentions',
    ],
  },
  {
    name: 'Talking Head · Camera', category: 'video',
    items: [
      'Lens cleaned', 'Camera level on tripod', 'Eyeline at 1/3 line (eye contact)', '4K/vertical ratio decided', 'Frame: headroom + breathing room rule', 'Focus locked on eyes', 'Shutter double of frame rate', 'Batteries charged + spares captured',
    ],
  },
  {
    name: 'B-Roll & Cutaways', category: 'video',
    items: [
      'List of needed cutaways from script', 'Hands-on action inserts shot', 'Location/setting establishing wide', 'Product/artifacts detail macro', 'Transition shots (wipes, passes)', 'Empty-room shot for edit flexibility', 'Filler-free pass: remove "um/uh" later', '30s+ of every b-roll clip',
    ],
  },
  {
    name: 'Post-Publish Assets', category: 'brand',
    items: [
      '3 thumbnail/title variants', 'Description with keyword bank', '5+ relevant hashtags', 'Pinned comment prompt', 'Shorts/Reels clip cut for repurpose', 'Links-in-bio updated', 'Analytics backfill scheduled (48h)', 'License-safety check on music/SFX',
    ],
  },
];

export function presetToItems(preset: ChecklistPreset): ChecklistItem[] {
  return preset.items.map((text) => ({ id: crypto.randomUUID(), text, checked: false }));
}