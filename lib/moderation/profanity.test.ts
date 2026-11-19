import { describe, expect, it } from 'vitest';
import { containsProfanity, findProfaneField, profanityMessage } from '@/lib/moderation/profanity';

describe('containsProfanity', () => {
  it('blocks profanity and slurs', () => {
    for (const text of ['what the fuck', 'you bitch', 'total bullshit', 'dickhead']) {
      expect(containsProfanity(text), text).toBe(true);
    }
  });

  it('sees through common disguises', () => {
    for (const text of ['sh1t happens', 'F*CK', 'fuuuuck this', 'SHIT']) {
      expect(containsProfanity(text), text).toBe(true);
    }
  });

  it('allows words that only contain a listed one', () => {
    for (const text of [
      'Lost dog near Scunthorpe Ln',
      'cocktail party at the pool',
      'assessment of the clubhouse',
      'Hancock Drive',
      'classic cars meetup',
    ]) {
      expect(containsProfanity(text), text).toBe(false);
    }
  });

  it('allows the innocent uses this site tuned for', () => {
    for (const text of [
      'Dick Smith yard sale',
      'Moby Dick book club',
      'tit for tat',
      'blue tits at the feeder',
      'sex offender registry update',
      'cumin chicken recipe',
      'pussy willow cuttings',
      'rapeseed oil',
      'flight sim cockpit',
      'shitzu puppy for adoption',
    ]) {
      expect(containsProfanity(text), text).toBe(false);
    }
  });

  it('allows mild language', () => {
    for (const text of ['what the hell', 'damn it', 'piece of crap']) {
      expect(containsProfanity(text), text).toBe(false);
    }
  });

  it('treats empty input as clean', () => {
    expect(containsProfanity('')).toBe(false);
    expect(containsProfanity(null)).toBe(false);
    expect(containsProfanity(undefined)).toBe(false);
  });
});

describe('findProfaneField', () => {
  it('names the first field that fails', () => {
    expect(findProfaneField({ title: 'Yard sale', description: 'no shit, everything goes' })).toBe('description');
  });

  it('checks each item in a list', () => {
    expect(findProfaneField({ question: 'Best day?', 'poll options': ['Saturday', 'fuck it, Sunday'] })).toBe(
      'poll options',
    );
  });

  it('returns null when everything is clean, including missing fields', () => {
    expect(findProfaneField({ title: 'Book club', description: null, location: undefined, tags: [] })).toBeNull();
  });
});

describe('profanityMessage', () => {
  it('names the field', () => {
    expect(profanityMessage('title')).toBe('Please remove offensive language from the title.');
  });
});
