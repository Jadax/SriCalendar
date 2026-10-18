import { describe, expect, it } from 'vitest';
import { adaptIdea, defaultPetProfile, generatePetIdeas, passesFiveWordTest, PET_MUSIC_MOODS, PET_PILLARS, PET_PLAYBOOK, type PetProfile } from './petBrain';

const profile: PetProfile = {
  name: 'Mochi',
  species: 'cat',
  personality: ['tiny CEO', 'food critic'],
  signature: 'half-closed judging eye',
  quirks: 'screams at 5am',
  loves: ['the treat bag', 'empty boxes'],
  rescue: false,
  platforms: ['tiktok', 'reels', 'shorts'],
  primary: 'tiktok',
};

describe('generatePetIdeas', () => {
  it('deterministically produces ideas that reuse the profile', () => {
    const a = generatePetIdeas(profile, 7, 's0');
    const b = generatePetIdeas(profile, 7, 's0');
    expect(a).toEqual(b);
    expect(a).toHaveLength(7);
    expect(a.some((idea) => idea.title.includes('Mochi'))).toBe(true);
    expect(a.every((idea) => idea.title.trim().length > 5)).toBe(true);
  });

  it('gives every idea a complete arc, angle, music and bounded score', () => {
    const ideas = generatePetIdeas(profile, 7, 's1');
    for (const idea of ideas) {
      expect(idea.arc.hook.length).toBeGreaterThan(5);
      expect(idea.arc.setup.length).toBeGreaterThan(5);
      expect(idea.arc.payoff.length).toBeGreaterThan(5);
      expect(idea.angle).toMatch(/—/);
      expect(idea.music.length).toBeGreaterThan(5);
      expect(idea.score).toBeGreaterThanOrEqual(1);
      expect(idea.score).toBeLessThanOrEqual(100);
      expect(PET_PILLARS.some((pillar) => pillar.key === idea.pillar)).toBe(true);
      expect(PET_MUSIC_MOODS[idea.pillar]).toBeDefined();
    }
  });

  it('reshuffles on a new seed and passes the five-word brevity test', () => {
    const round1 = generatePetIdeas({ ...profile, loves: ['empty boxes'] }, 7, 's0');
    const round2 = generatePetIdeas({ ...profile, loves: ['empty boxes'] }, 7, 's9');
    expect(round1.map((idea) => idea.title)).not.toEqual(round2.map((idea) => idea.title));
    for (const idea of round1) {
      expect(passesFiveWordTest(idea.title)).toBe(true);
      expect(passesFiveWordTest('this seventeen word title is far too long to stop a scrolling thumb mid-feed')).toBe(false);
    }
  });
});

describe('platform playbook', () => {
  it('covers every starter platform with differentiated guidance', () => {
    const shape = (key: string): string => { const book = PET_PLAYBOOK[key]; if (!book) throw new Error(`missing ${key}`); return book.hookRule; };
    expect(shape('tiktok')).not.toBe(shape('shorts'));
    expect(PET_PLAYBOOK.tiktok?.length).toContain('21');
    expect((PET_PLAYBOOK.reels?.audio ?? '').toLowerCase()).toContain('trending');
  });
});

describe('adaptIdea', () => {
  it('adapts one idea into per-platform cuts with distinct first frames', () => {
    const [idea] = generatePetIdeas(profile, 1, 's2');
    if (!idea) throw new Error('expected an idea');
    const cuts = adaptIdea(idea, ['tiktok', 'shorts']);
    expect(cuts).toHaveLength(2);
    expect(cuts[0]?.firstFrame).not.toBe(cuts[1]?.firstFrame);
    expect(cuts.some((cut) => cut.audio.includes('trending'))).toBe(true);
  });
});

describe('defaultPetProfile', () => {
  it('starts as a cat with a sensible starter playbook', () => {
    const fresh = defaultPetProfile();
    expect(fresh.species).toBe('cat');
    expect(fresh.primary).toBe('tiktok');
    expect(fresh.platforms).toContain('shorts');
  });
});
