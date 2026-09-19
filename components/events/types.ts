/** An event as rendered by the calendar and the day list. */
export type EventListItem = {
  id: string;
  title: string;
  description: string;
  /** ISO timestamp. Bucket into calendar days in the browser, never on the server. */
  date: string;
  endDate: string | null;
  location: string;
  status: string;
  category?: string;
};
