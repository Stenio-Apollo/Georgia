import type { AudioCueId, ConceptSlot } from '../audio/cues';
import type { AnswerChoice, Lesson, PlanetName, Subject, Visual } from '../lesson/types';

type PlanetSlug = PlanetName;

function displayName(slug: PlanetSlug): string {
  return slug === 'moon'
    ? 'Moon'
    : slug.charAt(0).toUpperCase() + slug.slice(1);
}

function planet(slug: PlanetSlug): Visual {
  return { kind: 'planet', name: slug };
}

function choice(slug: PlanetSlug): AnswerChoice {
  return { id: slug, label: displayName(slug), visual: planet(slug) };
}

function cue(slug: PlanetSlug, slot: ConceptSlot): AudioCueId {
  return `planet.${slug}.${slot}`;
}

interface PlanetLessonSpec {
  slug: PlanetSlug;
  number: number;
  choices: PlanetSlug[];
}

const SPECS: PlanetLessonSpec[] = [
  { slug: 'mercury', number: 1, choices: ['mercury', 'venus', 'mars'] },
  { slug: 'venus', number: 2, choices: ['earth', 'venus', 'moon'] },
  { slug: 'earth', number: 3, choices: ['jupiter', 'saturn', 'earth'] },
  { slug: 'mars', number: 4, choices: ['venus', 'mars', 'pluto'] },
  { slug: 'jupiter', number: 5, choices: ['jupiter', 'earth', 'saturn'] },
  { slug: 'saturn', number: 6, choices: ['uranus', 'saturn', 'jupiter'] },
  { slug: 'uranus', number: 7, choices: ['moon', 'pluto', 'uranus'] },
  { slug: 'neptune', number: 8, choices: ['saturn', 'neptune', 'pluto'] },
  { slug: 'pluto', number: 9, choices: ['pluto', 'mars', 'mercury'] },
  { slug: 'moon', number: 0, choices: ['moon', 'mercury', 'uranus'] },
  { slug: 'sun', number: 0, choices: ['sun', 'earth', 'moon'] },
];

function planetLesson({ slug, number, choices }: PlanetLessonSpec): Lesson {
  const name = displayName(slug);
  return {
    id: `planet-${slug}`,
    pickerLabel: `${slug === 'sun' ? '000' : String(number).padStart(2, '0')} — ${name.toUpperCase()}`,
    concept: {
      id: slug,
      name,
      inSentence: slug === 'moon' || slug === 'sun' ? `the ${name}` : name,
      subject: 'planets',
      visual: planet(slug),
    },
    steps: [
      {
        id: `${slug}-introduction`,
        type: 'introduction',
        audio: [cue(slug, 'this-is'), cue(slug, 'name')],
      },
      {
        id: `${slug}-guided`,
        type: 'guided',
        audio: [cue(slug, 'touch-prompt')],
        successAudio: [cue(slug, 'touch-success')],
      },
      {
        id: `${slug}-question`,
        type: 'question',
        audio: [cue(slug, 'find-prompt')],
        question: {
          kind: 'find-the-target',
          choices: choices.map(choice),
          correctChoiceId: slug,
        },
        correctAudio: [cue(slug, 'find-success')],
        retryAudio: ['shared.try-again'],
      },
      {
        id: `${slug}-completion`,
        type: 'completion',
        audio: [cue(slug, 'complete')],
      },
    ],
  };
}

export const planetLessons = SPECS.map(planetLesson);

export const planetsSubject: Subject = {
  id: 'planets',
  title: 'Planets',
  description: 'Mercury, Venus, Earth...',
  lessons: planetLessons,
};
