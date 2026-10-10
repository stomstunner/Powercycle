export type Product = {
  slug: string;
  name: string;
  description: string;
  priceInr: number;
  category: string;
  sourceMaterial: string;
  conditionNote: string;
  isDemo: true;
};

export const products: Product[] = [
  ['refurbished-bluetooth-speaker', 'Refurbished Bluetooth Speaker', 1499, 'Audio', 'Recovered speaker components'],
  ['upcycled-keyboard-wall-art', 'Upcycled Keyboard Wall Art', 499, 'Decor', 'Retired keyboard keys'],
  ['electronic-parts-desk-organizer', 'Electronic Parts Desk Organizer', 399, 'Desk', 'Recovered electronic parts'],
  ['cable-organizer', 'Cable Organizer', 199, 'Desk', 'Reclaimed cable materials'],
  ['upcycled-cd-decoration', 'Upcycled CD Decoration', 249, 'Decor', 'Retired optical discs'],
  ['diy-stem-electronics-learning-kit', 'DIY STEM/Electronics Learning Kit', 699, 'Learning', 'Recovered low-voltage components'],
  ['refurbished-computer-mouse', 'Refurbished Computer Mouse', 299, 'Accessories', 'Tested recovered mouse'],
  ['refurbished-led-desk-lamp', 'Refurbished LED Desk Lamp', 599, 'Lighting', 'Recovered lamp components'],
  ['tech-themed-photo-frame', 'Tech-Themed Photo Frame', 349, 'Decor', 'Recovered circuit-board details'],
  ['mini-storage-box', 'Mini Storage Box', 299, 'Storage', 'Reclaimed device casing'],
].map(([slug, name, priceInr, category, sourceMaterial]) => ({
  slug: slug as string,
  name: name as string,
  description: 'A demonstration marketplace listing for the PowerCycle prototype.',
  priceInr: priceInr as number,
  category: category as string,
  sourceMaterial: sourceMaterial as string,
  conditionNote: 'Prototype listing; availability, fulfilment, and warranty are not provided.',
  isDemo: true,
}));

export type Idea = {
  slug: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium';
  safetyNotes: string;
};

export const ideas: Idea[] = [
  ['keyboard-key-art', 'Keyboard-Key Art', 'Arrange retired keys into a word or pattern.', 'easy'],
  ['cd-decoration', 'CD Decoration', 'Use retired discs as reflective, non-electrical decor.', 'easy'],
  ['cable-organisation', 'Cable Organisation', 'Bundle loose cables with reclaimed clips and labels.', 'easy'],
  ['safe-casing-reuse', 'Safe Casing Reuse', 'Turn an empty, inspected plastic casing into storage.', 'easy'],
  ['educational-kit', 'Educational Learning Kit', 'Create a supervised low-voltage learning collection.', 'medium'],
  ['desk-organiser', 'Desk Organiser', 'Group retired knobs and cases into a desktop tray.', 'easy'],
  ['photo-frame', 'Tech Photo Frame', 'Use non-sharp board fragments as frame accents.', 'easy'],
  ['component-display', 'Component Display', 'Display cleaned, non-powered components in a labeled case.', 'medium'],
].map(([slug, title, description, difficulty]) => ({
  slug: slug as string,
  title: title as string,
  description: description as string,
  difficulty: difficulty as 'easy' | 'medium',
  safetyNotes: 'Do not dismantle batteries, CRT displays, power supplies, or mains-powered devices.',
}));
