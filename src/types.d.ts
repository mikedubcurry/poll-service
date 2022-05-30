export interface Poll {
  pollId?: string;
  question: string;
  answers: [string, string, string, string];
  votes: {
    [key: string]: number;
  };
  done: boolean;
  createdAt?: string;
  lastUpdatedAt?: string;
}
