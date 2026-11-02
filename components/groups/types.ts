/** A poll as the group page renders it: names resolved, permissions decided on the server. */
export type PollView = {
  id: string;
  question: string;
  allowMultiple: boolean;
  allowMemberOptions: boolean;
  closesAt: string | null;
  open: boolean;
  creatorName: string;
  /** Creator or site admin: may close or delete. */
  canManage: boolean;
  /** Distinct people who voted on any option. */
  voterCount: number;
  options: Array<{
    id: string;
    label: string;
    voters: string[];
    votedByMe: boolean;
  }>;
};

/** A sign-up sheet as the group page renders it. */
export type SignupView = {
  id: string;
  title: string;
  description: string | null;
  open: boolean;
  creatorName: string;
  canManage: boolean;
  slots: Array<{
    id: string;
    label: string;
    /** Null means unlimited. */
    capacity: number | null;
    claims: Array<{ name: string; note: string | null; mine: boolean }>;
  }>;
};
