import {
  DataSet,
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
  pattern,
} from 'obscenity';

/**
 * Site-wide profanity check for anything people post.
 *
 * Built on obscenity's English list, which already sees through spacing,
 * repeated letters, leetspeak and stand-in symbols ("sh1t", "f*ck",
 * "fuuuck") without flagging words that merely contain a bad one
 * (Scunthorpe, assessment, cocktail). Tuned for a neighborhood site:
 *
 * - Dropped: words with common innocent uses here. "dick" (a first name,
 *   Moby Dick), "tit" (tit for tat, blue tits at the feeder), "sex" (a sex
 *   offender registry is a fair thing to discuss) and "hooker".
 * - Allowed: everyday words that contain a listed one.
 * - Mild words (crap, damn, hell) were never on the list and stay allowed.
 */
const DROPPED = new Set(['dick', 'tit', 'sex', 'hooker']);

const ALLOWED_TERMS = [
  'cumin',
  'pussycat',
  'pussy willow',
  'rapeseed',
  'cockpit',
  'penistone',
  // A common misspelling of shih tzu.
  'shitzu',
];

const dataset = new DataSet<{ originalWord: string }>()
  .addAll(englishDataset)
  .removePhrasesIf((phrase) => DROPPED.has(phrase.metadata?.originalWord ?? ''))
  // Dropping "dick" must not let the insult through.
  .addPhrase((phrase) => phrase.setMetadata({ originalWord: 'dickhead' }).addPattern(pattern`dickhead`));

const built = dataset.build();

const matcher = new RegExpMatcher({
  ...built,
  whitelistedTerms: [...(built.whitelistedTerms ?? []), ...ALLOWED_TERMS],
  ...englishRecommendedTransformers,
});

/** True when `text` contains a blocked word. */
export function containsProfanity(text: string | null | undefined): boolean {
  return !!text && matcher.hasMatch(text);
}

/**
 * The name of the first field containing a blocked word, or null when all are
 * clean. Keys are what the person sees in the error ("title", "poll options"),
 * values are the submitted text; a list is checked item by item.
 */
export function findProfaneField(
  fields: Record<string, string | null | undefined | readonly string[]>,
): string | null {
  for (const [name, value] of Object.entries(fields)) {
    const values = Array.isArray(value) ? value : [value];
    if (values.some((v) => containsProfanity(v as string | null | undefined))) return name;
  }
  return null;
}

/** The 400 message for a field that failed the check. */
export function profanityMessage(field: string): string {
  return `Please remove offensive language from the ${field}.`;
}
