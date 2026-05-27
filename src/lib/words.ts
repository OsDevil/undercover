import type { WordPair } from "./types";

export const WORD_PAIRS: WordPair[] = [
  // Easy
  { civil: "Chien", undercover: "Chat", difficulty: "easy" },
  { civil: "Pizza", undercover: "Burger", difficulty: "easy" },
  { civil: "Été", undercover: "Hiver", difficulty: "easy" },
  { civil: "Mer", undercover: "Montagne", difficulty: "easy" },
  { civil: "Vélo", undercover: "Moto", difficulty: "easy" },
  { civil: "Soleil", undercover: "Lune", difficulty: "easy" },
  { civil: "Train", undercover: "Avion", difficulty: "easy" },
  { civil: "Café", undercover: "Thé", difficulty: "easy" },
  { civil: "Football", undercover: "Rugby", difficulty: "easy" },
  { civil: "Guitare", undercover: "Piano", difficulty: "easy" },
  { civil: "Pomme", undercover: "Poire", difficulty: "easy" },
  { civil: "Bière", undercover: "Vin", difficulty: "easy" },
  { civil: "Cinéma", undercover: "Théâtre", difficulty: "easy" },
  { civil: "Chat", undercover: "Lapin", difficulty: "easy" },
  { civil: "Natation", undercover: "Course à pied", difficulty: "easy" },
  { civil: "Paris", undercover: "Londres", difficulty: "easy" },
  { civil: "Chocolat", undercover: "Caramel", difficulty: "easy" },
  { civil: "Livre", undercover: "Magazine", difficulty: "easy" },
  { civil: "Médecin", undercover: "Infirmier", difficulty: "easy" },
  { civil: "Table", undercover: "Bureau", difficulty: "easy" },

  // Medium
  { civil: "Violon", undercover: "Alto", difficulty: "medium" },
  { civil: "Netflix", undercover: "Disney+", difficulty: "medium" },
  { civil: "Sushi", undercover: "Maki", difficulty: "medium" },
  { civil: "Boxe", undercover: "MMA", difficulty: "medium" },
  { civil: "Yoga", undercover: "Pilates", difficulty: "medium" },
  { civil: "Vodka", undercover: "Tequila", difficulty: "medium" },
  { civil: "Instagram", undercover: "TikTok", difficulty: "medium" },
  { civil: "Baguette", undercover: "Croissant", difficulty: "medium" },
  { civil: "Loup", undercover: "Renard", difficulty: "medium" },
  { civil: "Requin", undercover: "Dauphin", difficulty: "medium" },
  { civil: "Avocat", undercover: "Notaire", difficulty: "medium" },
  { civil: "Psychologue", undercover: "Psychiatre", difficulty: "medium" },
  { civil: "Escalade", undercover: "Alpinisme", difficulty: "medium" },
  { civil: "Ramen", undercover: "Pho", difficulty: "medium" },
  { civil: "Platine vinyle", undercover: "Chaîne hi-fi", difficulty: "medium" },
  { civil: "Camembert", undercover: "Brie", difficulty: "medium" },
  { civil: "Piscine", undercover: "Jacuzzi", difficulty: "medium" },
  { civil: "Tatouage", undercover: "Piercing", difficulty: "medium" },
  { civil: "Architecte", undercover: "Designer", difficulty: "medium" },
  { civil: "Marathon", undercover: "Triathlon", difficulty: "medium" },

  // Hard
  { civil: "Oxygène", undercover: "Azote", difficulty: "hard" },
  { civil: "FBI", undercover: "CIA", difficulty: "hard" },
  { civil: "Champagne", undercover: "Prosecco", difficulty: "hard" },
  { civil: "Golf", undercover: "Polo", difficulty: "hard" },
  { civil: "Cubisme", undercover: "Impressionnisme", difficulty: "hard" },
  { civil: "Procrastiner", undercover: "Flemmarder", difficulty: "hard" },
  { civil: "Andante", undercover: "Allegro", difficulty: "hard" },
  { civil: "Sonar", undercover: "Radar", difficulty: "hard" },
  { civil: "Épée", undercover: "Fleuret", difficulty: "hard" },
  { civil: "Botox", undercover: "Acide hyaluronique", difficulty: "hard" },
  { civil: "Freelance", undercover: "Auto-entrepreneur", difficulty: "hard" },
  { civil: "Scalpel", undercover: "Bistouri", difficulty: "hard" },
  { civil: "Grenadine", undercover: "Sirop de menthe", difficulty: "hard" },
  { civil: "Compost", undercover: "Fumier", difficulty: "hard" },
  { civil: "Notaire", undercover: "Huissier", difficulty: "hard" },
  { civil: "Mise en scène", undercover: "Chorégraphie", difficulty: "hard" },
  { civil: "Podcast", undercover: "Audiobook", difficulty: "hard" },
  { civil: "VPN", undercover: "Proxy", difficulty: "hard" },
  { civil: "Sprint", undercover: "Iteration", difficulty: "hard" },
  { civil: "Hedge fund", undercover: "Private equity", difficulty: "hard" },
];

export function getRandomPair(difficulty: "easy" | "medium" | "hard"): WordPair {
  const filtered = WORD_PAIRS.filter((p) => p.difficulty === difficulty);
  const idx = Math.floor(Math.random() * filtered.length);
  return filtered[idx] ?? filtered[0]!;
}
