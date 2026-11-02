export const SUPPORT_CATEGORIES = [
  { value: 'bug',     label: 'Something is broken' },
  { value: 'account', label: 'Account or sign-in' },
  { value: 'feature', label: 'Feature request' },
  { value: 'content', label: 'Report a listing or post' },
  { value: 'question', label: 'General question' },
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number]['value'];
