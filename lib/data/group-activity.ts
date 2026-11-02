/** Limits shared by the group poll / sign-up routes and the forms that feed them. */
export const POLL_LIMITS = {
  question: 200,
  option: 100,
  minOptions: 2,
  maxOptions: 10,
  /** Ceiling once members start adding their own. */
  maxOptionsWithMemberAdds: 20,
} as const;

export const SIGNUP_LIMITS = {
  title: 150,
  description: 1000,
  slotLabel: 100,
  minSlots: 1,
  maxSlots: 20,
  maxCapacity: 100,
  note: 200,
} as const;
