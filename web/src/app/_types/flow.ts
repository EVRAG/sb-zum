export type Step =
  | "intro"
  | "rules"
  | "gender"
  | "location"
  | "capture"
  | "capture_done"
  | "loading"
  | "done"
  | "qr";

export type Gender = "male" | "female" | "kid_male" | "kid_female";

export type LocationCard = {
  id: number;
  title: string;
  subtitle?: string;
  color: string;
  image?: string;
};

