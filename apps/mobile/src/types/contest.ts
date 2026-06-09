export interface Contest {
  id: number;
  title: string;
  organizer: string;
  deadline: string;
  categories: string[];
  thumbnail: string | null;
  description: string;
}
