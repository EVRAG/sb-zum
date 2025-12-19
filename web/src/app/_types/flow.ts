export type Step =
  | "intro"
  | "rules"
  | "gender"
  | "location"
  | "capture"
  | "capture_done"
  | "loading"
  | "done";

export type Gender = "male" | "female";

export type LocationCard = {
  id: string;
  title: string;
  subtitle?: string;
  color: string;
  image?: string;
};

