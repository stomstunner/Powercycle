export type Product = {
  slug: string;
  name: string;
  description: string;
  priceInr: number;
  category: string;
  sourceMaterial: string;
  conditionNote: string;
  isDemo: true;
  imageUrl: string;
  sellerName: string;
  sellerLocation: string;
  specifications: Array<{ label: string; value: string }>;
  includedItems: string[];
};

const photo = (id: string, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
const productPhotoIds = [
  'photo-1517336714731-489689fd1ca8', 'photo-1598327105666-5b89351aff97', 'photo-1511707171634-5f897ff02aa9',
  'photo-1496181133206-80ce9b88a853', 'photo-1527814050087-3793815479db', 'photo-1608043152269-423dbba4e7e1',
  'photo-1583394838336-acd977736f90', 'photo-1588872657578-7efd1f1555ed', 'photo-1512499617640-c74ae3a79d37',
  'photo-1544244015-0df4b3ffc6b0', 'photo-1516035069371-29a1b244cc32', 'photo-1527443224154-c4a3942d3acf',
  'photo-1587829741301-dc798b83add3', 'photo-1523206489230-c012c64b2b48', 'photo-1505740420928-5e560c06d30e',
  'photo-1593640408182-31c70c8268f5', 'photo-1588872657578-7efd1f1555ed', 'photo-1592899677977-9c10ca588bbd',
  'photo-1585386959984-a4155224a1ad', 'photo-1583394838336-acd977736f90', 'photo-1598327105666-5b89351aff97',
  'photo-1496181133206-80ce9b88a853', 'photo-1527814050087-3793815479db', 'photo-1608043152269-423dbba4e7e1',
  'photo-1517336714731-489689fd1ca8', 'photo-1544244015-0df4b3ffc6b0', 'photo-1516035069371-29a1b244cc32',
  'photo-1527443224154-c4a3942d3acf', 'photo-1511707171634-5f897ff02aa9', 'photo-1588872657578-7efd1f1555ed',
];

type ProductRow = [slug: string, name: string, price: number, category: string, material: string, condition: string, description: string, specs: string, included: string];
const productRows: ProductRow[] = [
  ['refurbished-bluetooth-speaker', 'Refurbished Bluetooth Speaker', 1499, 'Audio', 'Recovered speaker components', 'Refurbished demo · functionality not verified', 'Portable speaker concept with a fabric grille and rechargeable battery. This sample listing explains the kind of details a real seller should verify before sale.', 'Portable audio; Bluetooth; battery condition unverified', 'Speaker only; charger not included'],
  ['upcycled-keyboard-wall-art', 'Upcycled Keyboard Wall Art', 499, 'Decor', 'Retired keyboard keys', 'Handmade demo example', 'A framed graphic made from cleaned, non-powered keyboard keycaps. Key layout and finish vary by maker.', 'Approx. 20 × 25 cm; wall-hanging frame; handmade', 'Decorative frame; hanging hook'],
  ['electronic-parts-desk-organizer', 'Electronic Parts Desk Organizer', 399, 'Desk', 'Recovered electronic parts', 'Handmade demo example', 'A small desk caddy using cleaned, blunt, non-powered parts set into a stable base. Not a storage container for food.', 'Approx. 15 × 10 × 8 cm; reclaimed exterior', 'One desk organizer'],
  ['cable-organizer', 'Reusable Cable Wrap Set', 199, 'Accessories', 'Reclaimed fabric and cable offcuts', 'Handmade demo example', 'Soft reusable ties help keep charging and audio cables untangled. The ties are decorative organizers, not electrical repair parts.', 'Set of 5; assorted lengths; reusable ties', 'Five cable wraps'],
  ['upcycled-cd-decoration', 'Upcycled CD Sun Catcher', 249, 'Decor', 'Retired optical discs', 'Handmade demo example', 'Reflective retired discs are mounted as lightweight indoor decor. Keep away from children and direct heat.', 'Approx. 25 cm hanging length; indoor use', 'One hanging decoration'],
  ['diy-stem-electronics-learning-kit', 'Low-Voltage STEM Learning Kit', 699, 'Learning', 'Recovered low-voltage components', 'Demo kit · component testing required', 'A supervised learning pack concept for identifying safe, low-voltage components. Contents must be checked by an adult before use.', 'Low-voltage only; exact components vary; adult supervision', 'Assorted parts; no mains or battery cells'],
  ['refurbished-computer-mouse', 'Refurbished USB Mouse', 299, 'Accessories', 'Tested recovered mouse', 'Refurbished demo · test before use', 'Wired USB mouse example listing. A real seller should confirm cursor, wheel, buttons and cable condition.', 'USB wired; optical; model unspecified', 'Mouse only'],
  ['refurbished-led-desk-lamp', 'Refurbished LED Desk Lamp', 599, 'Lighting', 'Recovered lamp components', 'Refurbished demo · electrical inspection required', 'Desk lamp example with recovered housing. Mains electrical parts must be inspected by a qualified technician before use.', 'LED desk lamp; input and wattage not verified', 'Lamp only; bulb and warranty not confirmed'],
  ['tech-themed-photo-frame', 'Circuit-Pattern Photo Frame', 349, 'Decor', 'Recovered circuit-board details', 'Handmade demo example', 'A photo frame with decorative, cleaned circuit-board accents sealed behind a smooth protective layer.', 'Fits 10 × 15 cm photo; tabletop display', 'One frame'],
  ['mini-storage-box', 'Reused Electronics Parts Box', 299, 'Storage', 'Reclaimed device casing', 'Handmade demo example', 'A cleaned, empty outer casing repurposed for stationery or small dry items. No electronic parts or batteries remain.', 'Approx. 18 × 12 × 6 cm; dry indoor storage', 'One empty storage box'],
  ['refurbished-laptop-core-i5', 'Refurbished 14-inch Laptop', 12999, 'Laptops', 'Reused laptop components', 'Refurbished demo · specs illustrative only', 'Example refurbished laptop listing. Before any real sale, confirm exact model, battery health, charger, storage, RAM and operating-system activation.', '14-inch display; Core i5 class; RAM/storage unverified', 'Laptop only; charger status to be confirmed'],
  ['refurbished-laptop-student', 'Student Laptop 8 GB RAM', 15999, 'Laptops', 'Recovered and inspected laptop', 'Refurbished demo · specs illustrative only', 'A budget laptop listing example for browsing, documents and online classes. Battery runtime and ports need an in-person check.', '8 GB RAM stated as example; SSD size unverified; webcam check needed', 'Laptop; charger inclusion must be confirmed'],
  ['refurbished-laptop-business', 'Business Laptop with SSD', 18999, 'Laptops', 'Refurbished business device', 'Refurbished demo · specs illustrative only', 'Business laptop example with a fast-storage configuration. Ask for the exact model number and proof of a clean OS reset.', 'SSD listed; processor generation and capacity unverified', 'Laptop; no software licence represented'],
  ['refurbished-laptop-compact', 'Compact 13-inch Laptop', 16999, 'Laptops', 'Reused laptop components', 'Refurbished demo · specs illustrative only', 'Compact laptop example for travel and everyday work. Check hinge stability, keyboard, screen and battery before arranging a purchase.', '13-inch class; resolution and battery condition unverified', 'Laptop only'],
  ['refurbished-android-phone', 'Refurbished Android Phone', 5999, 'Phones', 'Recovered smartphone', 'Refurbished demo · specs illustrative only', 'Android phone listing example. Confirm model, IMEI status, screen, cameras, charging, battery health and factory reset in person.', 'Android; storage and model unverified; network lock status unknown', 'Phone only; accessories not confirmed'],
  ['refurbished-iphone', 'Refurbished Smartphone · iOS', 14999, 'Phones', 'Reused smartphone', 'Refurbished demo · specs illustrative only', 'iOS phone example. A real listing must confirm model, storage, battery health, activation lock removal and ownership before payment.', 'Model/storage unverified; activation-lock status must be checked', 'Phone only; no warranty implied'],
  ['budget-android-phone', 'Budget Android Smartphone', 4499, 'Phones', 'Reused smartphone', 'Refurbished demo · specs illustrative only', 'Affordable phone example for calls and basic apps. Verify network compatibility, battery, charging port and screen response.', 'Entry-level class; exact model, RAM and storage unverified', 'Phone; charger inclusion must be confirmed'],
  ['refurbished-android-tablet', 'Refurbished Android Tablet', 6999, 'Tablets', 'Recovered tablet components', 'Refurbished demo · specs illustrative only', 'Tablet example for reading and video calls. Confirm touchscreen zones, speakers, Wi-Fi and battery runtime with the seller.', '10-inch class; model and storage unverified', 'Tablet only'],
  ['refurbished-ipad', 'Refurbished Tablet · iPad', 11999, 'Tablets', 'Reused tablet', 'Refurbished demo · specs illustrative only', 'Tablet listing example. Ask the seller to remove activation lock and demonstrate charging and touch response before buying.', 'Model, generation and storage unverified; activation lock must be cleared', 'Tablet only; accessories not confirmed'],
  ['refurbished-wireless-earbuds', 'Refurbished Wireless Earbuds', 999, 'Audio', 'Recovered audio accessories', 'Refurbished demo · hygiene and battery checks needed', 'Earbuds example listing. A real seller should clean replaceable tips, verify both sides, case charging and battery runtime.', 'Bluetooth; runtime and water resistance unverified', 'Earbuds and case; tips/accessories not confirmed'],
  ['refurbished-wired-earphones', 'Wired Earphones · Tested Example', 299, 'Audio', 'Reused audio accessory', 'Refurbished demo · test both channels', 'Wired earphone example. Confirm both channels, microphone, plug and cable insulation; do not buy if copper is exposed.', '3.5 mm class; microphone and device compatibility to be checked', 'Earphones only'],
  ['refurbished-monitor-24', 'Refurbished 24-inch Monitor', 4999, 'Displays', 'Recovered monitor components', 'Refurbished demo · electrical inspection required', 'Desktop monitor example. Confirm panel pixels, ports, stand and included power/video cables. The power adapter must be inspected.', '24-inch class; resolution and refresh rate unverified', 'Monitor only; cables to be confirmed'],
  ['refurbished-keyboard', 'Refurbished USB Keyboard', 499, 'Accessories', 'Tested recovered keyboard', 'Refurbished demo · key test recommended', 'Wired keyboard example. Ask for a full key test and close-up photographs of the cable and keycaps.', 'USB wired; layout and key rollover unverified', 'Keyboard only'],
  ['refurbished-gaming-mouse', 'Refurbished Gaming Mouse', 799, 'Accessories', 'Recovered gaming accessory', 'Refurbished demo · controls unverified', 'Gaming mouse example with configurable controls. Confirm sensor, scroll wheel, switches and software compatibility.', 'USB; DPI and programmable buttons unverified', 'Mouse only'],
  ['refurbished-router', 'Refurbished Wi-Fi Router', 899, 'Networking', 'Recovered network device', 'Refurbished demo · reset and security checks needed', 'Router example. Reset to factory settings, update firmware and change default credentials before connecting it to a network.', 'Wi-Fi generation and ISP compatibility unverified', 'Router and power adapter; adapter inspection required'],
  ['refurbished-camera', 'Refurbished Digital Camera', 7999, 'Cameras', 'Recovered camera body', 'Refurbished demo · shutter and sensor checks needed', 'Camera example. Check sensor, shutter, buttons, lens mount, battery compartment and sample photos before payment.', 'Megapixels, model and shutter count unverified', 'Camera body only; lens/battery status to be confirmed'],
  ['refurbished-smartwatch', 'Refurbished Smartwatch', 2499, 'Wearables', 'Recovered wearable device', 'Refurbished demo · battery and pairing checks needed', 'Smartwatch example. Check screen, buttons, charging, pairing and account-lock removal. Avoid devices with a swollen battery.', 'Screen size and compatibility unverified; battery health unknown', 'Watch only; charger status to be confirmed'],
  ['refurbished-game-controller', 'Refurbished Game Controller', 1499, 'Gaming', 'Recovered game controller', 'Refurbished demo · drift test recommended', 'Controller example. Test stick drift, triggers, buttons, wireless pairing and charging before agreeing to buy.', 'Platform compatibility and battery health unverified', 'Controller only'],
  ['refurbished-power-bank', 'Refurbished Power Bank', 499, 'Power', 'Recovered portable charger', 'Refurbished demo · battery safety inspection required', 'Power bank example. Only use a professionally inspected unit with intact casing; reject swelling, heat, smell or leakage.', 'Capacity and output ratings unverified; inspection required', 'Power bank only; cable not confirmed'],
  ['refurbished-webcam', 'Refurbished USB Webcam', 999, 'Accessories', 'Recovered camera accessory', 'Refurbished demo · image/microphone test needed', 'Webcam example for online classes. Confirm video, focus, microphone, clip and operating-system compatibility.', 'USB; resolution and microphone quality unverified', 'Webcam and attached cable'],
];

export const products: Product[] = productRows.map((row, index) => {
  const [slug, name, priceInr, category, sourceMaterial, conditionNote, description, specLine, includedLine] = row;
  const sellerName = `PowerCycle Demo Seller ${String(index + 1).padStart(2, '0')}`;
  const sellerLocation = ['New Delhi, Delhi', 'Mumbai, Maharashtra', 'Bengaluru, Karnataka', 'Pune, Maharashtra', 'Jaipur, Rajasthan'][index % 5];
  return {
    slug, name, priceInr, category, sourceMaterial,
    conditionNote: `${conditionNote}; Seller: ${sellerName} · ${sellerLocation} (demo profile).`,
    description: `${description} Example specifications: ${specLine}. Included: ${includedLine}.`,
    isDemo: true as const,
    imageUrl: photo(productPhotoIds[index]),
    sellerName,
    sellerLocation,
    specifications: specLine.split('; ').map((part, partIndex) => ({ label: ['Key details', 'Condition check', 'Seller note'][Math.min(partIndex, 2)], value: part })),
    includedItems: includedLine.split('; '),
  };
});

export type IdeaStep = { id: string; position: number; title: string; description: string; image: { url: string; source?: string; alt?: string } };
export type Idea = {
  slug: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium';
  safetyNotes: string;
  materials: string[];
  tags: string[];
  coverImage: { url: string; source?: string; alt?: string };
  references?: Array<{ label: string; url: string }>;
  steps: IdeaStep[];
};

// Topic-matched, real web photography. Unsplash images use its free image CDN;
// a few craft/recycling examples link directly to the source article's image.
const ideaPhotoGroups: Record<string, string[]> = {
  craft: [
    'photo-1513364776144-60967b0f800f', 'https://framerusercontent.com/images/NoSIyYEK7DQWSNx6ZuTxX65rSEo.jpg?height=1200&width=1600',
    'photo-1455390582262-044cdead277a', 'photo-1528459105426-b9548367069b',
  ],
  plastic: [
    'https://hips.hearstapps.com/hmg-prod/images/6ae08c41-94be-4f40-9487-2bb0823c59fd.jpg?crop=0.888671875xw%3A1xh%3Bcenter%2Ctop&resize=1200%3A%2A',
    'https://phelieunhuahcm.com/upload/baiviet/trongrautrongchainhua-3029.jpg',
    'https://hips.hearstapps.com/hmg-prod/images/6ae08c41-94be-4f40-9487-2bb0823c59fd.jpg?crop=0.888671875xw%3A1xh%3Bcenter%2Ctop&resize=1200%3A%2A',
    'https://phelieunhuahcm.com/upload/baiviet/trongrautrongchainhua-3029.jpg',
  ],
  bottleHolder: [
    'https://hips.hearstapps.com/hmg-prod/images/a83e3741-95f1-4933-a6af-870ec73240a4.jpg',
    'https://media.indozone.id/crop/1200x630%3A0x0/smart/photo/indizone/2022/07/22/5js5J5j/7-kerajinan-tangan-dari-botol-plastik-bekas-yang-mudah-dibuat89.jpg',
    'https://hips.hearstapps.com/hmg-prod/images/a83e3741-95f1-4933-a6af-870ec73240a4.jpg',
    'https://media.indozone.id/crop/1200x630%3A0x0/smart/photo/indizone/2022/07/22/5js5J5j/7-kerajinan-tangan-dari-botol-plastik-bekas-yang-mudah-dibuat89.jpg',
  ],
  phoneStand: [
    'https://1.bp.blogspot.com/-AvTgWi_A9ok/XvHYdhjrH6I/AAAAAAAATVo/d3xinBXu9DM3f1a8JwoFGL4YnCN22nckgCK4BGAsYHg/s1200/IMG_20200411_180302.jpg',
    'https://1.bp.blogspot.com/-AvTgWi_A9ok/XvHYdhjrH6I/AAAAAAAATVo/d3xinBXu9DM3f1a8JwoFGL4YnCN22nckgCK4BGAsYHg/s1200/IMG_20200411_180302.jpg',
    'https://1.bp.blogspot.com/-AvTgWi_A9ok/XvHYdhjrH6I/AAAAAAAATVo/d3xinBXu9DM3f1a8JwoFGL4YnCN22nckgCK4BGAsYHg/s1200/IMG_20200411_180302.jpg',
    'https://1.bp.blogspot.com/-AvTgWi_A9ok/XvHYdhjrH6I/AAAAAAAATVo/d3xinBXu9DM3f1a8JwoFGL4YnCN22nckgCK4BGAsYHg/s1200/IMG_20200411_180302.jpg',
  ],
  laptop: [
    'photo-1517336714731-489689fd1ca8', 'photo-1496181133206-80ce9b88a853',
    'photo-1593640408182-31c70c8268f5', 'photo-1516321318423-f06f85e504b3',
  ],
  phone: ['photo-1598327105666-5b89351aff97', 'photo-1511707171634-5f897ff02aa9', 'photo-1523206489230-c012c64b2b48', 'photo-1512499617640-c74ae3a79d37'],
  audio: ['photo-1505740420928-5e560c06d30e', 'photo-1583394838336-acd977736f90', 'photo-1505740420928-5e560c06d30e', 'photo-1583394838336-acd977736f90'],
  keyboard: [
    'https://i.pinimg.com/originals/c0/48/e5/c048e56476b7ae70b741279c2e7f9bd2.jpg',
    'https://imagenes.computerhoy.20minutos.es/files/image_1920_1080/uploads/imagenes/2022/11/28/68e691f96b521.jpeg',
    'photo-1587829741301-dc798b83add3', 'photo-1527443224154-c4a3942d3acf',
  ],
  recycling: [
    'https://www.3econcepts.in/images/india_ewaste.jpg', 'photo-1532996122724-e3c354a0b15b',
    'https://bwmgroup.in/assets/images/Endeavours/Recycling/Desktop%20disposal.jpeg', 'photo-1581092921461-eab62e97a780',
  ],
  electronics: ['photo-1581092921461-eab62e97a780', 'photo-1581092160607-ee22621dd758', 'photo-1530124566582-a618bc2615dc', 'photo-1532996122724-e3c354a0b15b'],
};
type IdeaRow = [slug: string, title: string, description: string, difficulty: Idea['difficulty'], materials: string, steps: string, tags: string, caution?: string];
const ideaRows: IdeaRow[] = [
  ['keyboard-key-art', 'Keyboard-Key Art', 'Arrange retired keycaps into a name, short quote or geometric wall panel.', 'easy', 'Clean loose keycaps, cardboard backing, picture frame, ruler, craft glue', 'Choose a short design|Arrange the keys dry first|Glue keys onto firm backing|Fit backing into frame|Add hanging hardware and label the material story', 'keyboard,decor,beginner'],
  ['cd-decoration', 'CD Mosaic Sun Catcher', 'Make a reflective indoor decoration from retired discs without cutting them.', 'easy', 'Retired CDs, cardboard ring, string, blunt scissors, craft glue', 'Inspect discs for cracks|Draw a simple pattern on the ring|Glue whole discs or large intact sections|Let adhesive cure fully|Hang indoors away from heat and direct sun', 'cd,decor,beginner'],
  ['cable-organisation', 'Reusable Cable Wraps', 'Turn clean fabric offcuts into reusable ties for loose household cables.', 'easy', 'Clean fabric scraps, hook-and-loop dots, ruler, fabric scissors', 'Measure the cable bundle|Cut fabric strips with rounded corners|Fold edges to reduce fraying|Attach hook-and-loop dots|Wrap loosely around unplugged cables', 'cables,organise,beginner'],
  ['safe-casing-reuse', 'Electronics Casing Desk Tray', 'Repurpose an empty, inspected outer shell into a dry stationery tray.', 'easy', 'Clean empty plastic shell, mild soap, cloth, felt pads, labels', 'Use only an empty casing already separated from electronics|Wash and dry the shell completely|Check edges and cover rough spots|Apply felt pads to the base|Use for dry stationery only', 'plastic,storage,beginner','Never open a device or reuse battery compartments, power supplies or unknown parts.'],
  ['educational-kit', 'Low-Voltage Learning Board', 'Build a supervised display board from known, safe low-voltage learning components.', 'medium', 'Insulating board, labeled low-voltage modules, reusable fasteners, marker', 'Ask an adult to identify every part|Exclude cells, mains parts and damaged components|Arrange modules without connecting power|Label each component and its purpose|Store the board dry and disconnected', 'learning,electronics,supervised','This is a display and identification activity, not a powered circuit build.'],
  ['desk-organiser', 'Small Parts Desk Organizer', 'Make a stable holder for paper clips and stationery from cleaned inert components.', 'easy', 'Small clean casing, cardboard dividers, tape, felt pads', 'Select an empty non-electrical container|Measure compartments for stationery|Cut cardboard dividers to size|Fix dividers and add felt feet|Check stability before filling', 'desk,storage,reuse'],
  ['photo-frame', 'Circuit-Pattern Photo Frame', 'Add a circuit-inspired look to a reused photo frame with printed paper shapes.', 'easy', 'Reused frame, printed circuit pattern, glue stick, scissors', 'Remove the glass and old backing carefully|Print or draw a circuit pattern on paper|Trim paper to fit the frame border|Attach paper without sharp electronic parts|Reassemble and check the glass is secure', 'frame,decor,paper'],
  ['component-display', 'Labeled Parts Shadow Box', 'Create a non-powered educational display using only known, clean, blunt parts.', 'medium', 'Shadow-box frame, labels, known inert plastic parts, paper backing', 'Use parts identified by a knowledgeable adult|Reject sharp, leaking, powered or battery parts|Plan spacing on paper first|Attach parts behind a clear cover|Add a note that the display is non-functional', 'learning,display,reuse','Do not include capacitors, cells, bulbs, sharp metal or unknown components.'],
  ['paper-circuit-art', 'Paper Circuit-Inspired Poster', 'Draw a circuit map poster with colored paper paths instead of electrical connections.', 'easy', 'Reused cardboard, colored paper, pencil, ruler, glue stick', 'Flatten a clean piece of reused cardboard|Sketch a simple path and component symbols|Cut paper strips in different colors|Glue down the paths and labels|Add a note that it is artwork, not a working circuit', 'paper,art,beginner'],
  ['plastic-bottle-planter', 'Self-Watering Bottle Planter', 'Reuse a clean bottle as a small planter with adult help for cutting.', 'easy', 'Clean PET bottle, potting mix, cotton cord, plant, marker', 'Wash and dry the bottle|Ask an adult to cut the bottle safely|Thread cotton cord through the neck|Add soil and a small plant|Keep outdoors or on a waterproof tray and monitor water', 'plastic,garden,beginner','Do not use bottles that held chemicals; an adult must handle cutting.'],
  ['plastic-bottle-pen-stand', 'Bottle Pen Stand', 'Turn a clean bottle base into a simple stationery cup with a safe finished edge.', 'easy', 'Clean PET bottle, marker, decorative paper, tape, adult help', 'Wash and dry the bottle|Mark the desired cup height|Have an adult cut away from hands|Cover the rim with folded tape or fabric|Decorate and use for pens only', 'plastic,desk,beginner','An adult should cut the bottle; reject any cup with a sharp edge.'],
  ['plastic-bag-weaving', 'Make a Small Storage Basket from a Bottle and Bags', 'Weave clean plastic-bag strips around a bottle frame, then add a smooth inner liner. The finished basket is useful for dry stationery or craft supplies.', 'medium', 'Clean 1–2 L drink bottle, second clean drink bottle for liner, 2 clean bags in different colours, marker, ruler, scissors', 'Choose sturdy clean bottles and bags|Mark and cut the bottle stakes|Cut the bags into continuous weaving strips|Anchor the first two weavers|Weave the first row around the bottle|Build rows and join strips neatly|Fold the rim and fit the liner|Trim ends and test the basket', 'plastic,weaving,storage','Ask an adult to cut the bottle. Use only clean drink bottles and bags, never chemical containers. The basket is for light, dry storage only; not food, heat, liquids, children or heavy items.'],
  ['plastic-bottle-self-watering', 'Bottle Drip Watering Helper', 'Make a slow-watering aid from a clean bottle for a potted plant.', 'easy', 'Clean PET bottle, adult helper, potting soil, plant', 'Wash the bottle and remove its label|Ask an adult to make a tiny hole in the cap|Fill with water and secure the cap|Turn upside down into soil without forcing it|Check water flow and plant moisture each day', 'plastic,garden,reuse','Adult supervision is required for any puncture; do not leave standing water indoors.'],
  ['cardboard-phone-stand', 'Folded Cardboard Phone Stand', 'Cut and fold reused corrugated cardboard into a lightweight phone rest.', 'easy', 'Clean corrugated cardboard, ruler, pencil, scissors, paper tape', 'Trace a wide base and angled back support|Cut cardboard with scissors on a safe surface|Fold along the marked lines|Reinforce the joints with paper tape|Test with an unplugged phone and adjust the angle', 'cardboard,phone,beginner'],
  ['earphone-external-check', 'Wired Earphone Safe Check', 'Troubleshoot common wired-earphone issues using external checks only.', 'easy', 'Wired earphones, another known-good device, dry cloth', 'Unplug the earphones and inspect the cable for exposed copper|Check the plug and device port for visible debris without inserting tools|Try the earphones on another device at low volume|Test left, right and microphone functions|If the wire is frayed or audio cuts when moved, stop using and replace or use a qualified repairer', 'earphones,repair,safety','Do not splice wires, solder near the ears, or use earphones with exposed conductors.'],
  ['laptop-slow-safe-check', 'Laptop Running Slowly: Safe Checks', 'Try basic software and airflow checks before considering hardware service.', 'easy', 'Laptop, charger, backup drive or cloud backup, soft dry cloth', 'Save your work and back up important files|Restart and install updates from the official system settings|Close unused apps and check available storage|Place the laptop on a hard surface and clear external vents gently|If it overheats, smells unusual or shuts down, power off and seek repair service', 'laptop,maintenance,beginner','Do not open the laptop or insert objects into its vents.'],
  ['laptop-charging-check', 'Laptop Not Charging: External Checks', 'Check the charger and charging behavior without opening the computer.', 'easy', 'Laptop, original or compatible rated charger, dry surface', 'Check the wall socket with another safe appliance|Inspect charger cable and plug for cuts, heat marks or looseness|Confirm the charger rating matches the laptop guidance|Shut down, disconnect peripherals and reconnect once|Stop if there is heat, sparking, smell, swelling or a damaged cable and contact a technician', 'laptop,charging,safety','Never open a charger or laptop power circuit.'],
  ['phone-storage-cleanup', 'Free Space on an Older Phone', 'Recover storage using built-in settings and backed-up files.', 'easy', 'Phone, trusted backup destination, Wi-Fi connection', 'Check storage use in the phone settings|Back up photos and contacts to a trusted location|Remove downloads and duplicate files you recognize|Uninstall apps you no longer use|Restart and confirm enough free space remains', 'phone,maintenance,beginner'],
  ['phone-port-safe-check', 'Phone Charging Port: Safe Inspection', 'Check charging problems without poking or scraping the port.', 'easy', 'Phone, known-good compatible cable and adapter, flashlight', 'Unplug the phone and let it cool|Look for visible lint, corrosion or damage using a light|Try a known-good compatible cable and adapter|Restart and check the charging indicator|If debris is stuck or the port is loose, stop and visit a repair professional', 'phone,charging,safety','Do not insert metal tools, liquids or cotton swabs into the charging port.'],
  ['router-reuse-reset', 'Prepare an Old Router for Reuse', 'Reset and securely configure a router before passing it on.', 'medium', 'Router, original power adapter, internet provider instructions', 'Check the casing and adapter for heat or damage|Ask the owner to back up any settings they need|Use the official reset instructions for the exact model|Install current firmware from the maker’s official site|Set a new unique admin password and Wi-Fi password', 'router,network,reuse','Do not connect a device with a damaged adapter or unknown firmware.'],
  ['mouse-double-click-check', 'Mouse Double-Click Troubleshooting', 'Check settings and connections before deciding a mouse needs repair.', 'easy', 'Mouse, clean dry cloth, another USB port or device', 'Disconnect the mouse|Wipe its exterior with a dry cloth|Reconnect to another port or device|Check pointer and button settings in system settings|If clicks repeat across devices, replace it or ask a repair shop to inspect it', 'mouse,repair,beginner'],
  ['keyboard-key-clean', 'Clean a Sticky Keyboard Key Safely', 'Clean around a key without removing it or using liquids.', 'easy', 'Device powered off, soft brush, microfiber cloth', 'Shut down and unplug the keyboard or laptop|Turn a separate keyboard gently to release loose crumbs|Brush around the key with a soft dry brush|Wipe the key surface with a dry microfiber cloth|If the key remains stuck, arrange professional cleaning rather than prying it up', 'keyboard,maintenance,safety'],
  ['monitor-no-signal-check', 'Monitor Says No Signal: Safe Checks', 'Troubleshoot external display connections before seeking repair.', 'easy', 'Monitor, computer, compatible video cable', 'Confirm the monitor and computer are powered on|Check that the cable is firmly seated at both ends|Choose the correct input using the monitor menu|Try a known-good compatible cable or port|If the screen flickers, smells or gets unusually hot, unplug it and seek service', 'monitor,repair,beginner','Do not open a monitor; internal parts can retain dangerous voltage.'],
  ['tablet-battery-care', 'Care for an Older Tablet Battery', 'Use safer charging habits and watch for battery warning signs.', 'easy', 'Tablet, compatible charger, cool ventilated surface', 'Use a compatible undamaged charger|Charge on a hard surface away from bedding|Avoid heat and direct sunlight while charging|Unplug if the device becomes unusually hot|Stop using a swollen, leaking or damaged tablet and arrange professional service', 'tablet,battery,safety','Never press, puncture or attempt to replace a swollen battery yourself.'],
  ['old-phone-camera-scanner', 'Reuse an Old Phone as a Document Camera', 'Give a working old phone a low-risk second job for scanning papers.', 'easy', 'Working phone, stable stand, Wi-Fi, scanning app from official store', 'Back up and factory-reset the phone if transferring ownership|Install a trusted document-scanning app from the official store|Place the phone in a stable stand above the page|Use even lighting and keep personal data out of frame|Secure the phone and charger so they cannot fall or overheat', 'phone,creative,reuse'],
  ['laptop-photo-backup', 'Back Up Files Before Laptop Repair', 'Protect personal files before a repair visit or device handover.', 'easy', 'Laptop, external drive or trusted cloud storage, account recovery details', 'List the folders and files you cannot replace|Back up to an encrypted drive or trusted cloud account|Open several backed-up files to verify the copy|Sign out of sensitive accounts when appropriate|Tell the repair professional what data must be preserved and request consent before any wipe', 'laptop,data,maintenance'],
  ['charger-cable-check', 'Know When to Replace a Charger Cable', 'Spot visible cable damage and choose a safer replacement.', 'easy', 'Charger and cable unplugged, compatible device, maker specifications', 'Unplug the charger from the wall and device|Look along the full cable for cuts, exposed wires or kinks|Check plugs for looseness, discoloration or melted areas|Do not tape over damage or keep testing a damaged cable|Replace with a correctly rated cable from a reputable source', 'charger,safety,repair','Never open a power adapter or repair mains wiring.'],
  ['old-phone-desk-clock', 'Turn a Working Phone into a Desk Clock', 'Reuse a supported phone as a simple clock without opening its casing.', 'easy', 'Working phone, stable stand, compatible charger, clock app', 'Back up and remove personal accounts if the phone is being repurposed|Update the operating system and install a trusted clock app|Set the phone on a stable ventilated stand|Use a compatible charger and keep the cable away from walkways|Check temperature during the first hour and unplug if it becomes hot', 'phone,creative,reuse'],
  ['paper-electronics-gift-tag', 'Circuit-Style Recycled Gift Tags', 'Make gift tags from packaging card decorated with drawn circuit traces.', 'easy', 'Clean packaging cardboard, colored pens, hole punch, string', 'Flatten a clean piece of packaging card|Cut tags to a size that fits the gift|Draw decorative circuit lines and label the device material story|Punch a hole away from the edge|Reuse string and write a personal note on the back', 'paper,craft,gift'],
  ['e-waste-sort-at-home', 'Sort Small E-Waste Before Drop-Off', 'Prepare household electronics for a verified collection or authorized recycler.', 'easy', 'Small box, labels, tape, device list, local authorized recycler details', 'Separate electronics from household trash|Keep loose batteries apart and cover exposed battery terminals if the recycler instructs|Do not dismantle any device|Remove personal data from working phones and computers|Check accepted items and hours with an authorized local recycler before travel', 'recycling,collection,safety','Follow local recycler instructions; do not put batteries in regular bins.'],
];

const ideaTheme = (slug: string, tags: string) => {
  const searchable = `${slug} ${tags}`.toLowerCase();
  if (/e-waste|recycl|collection/.test(searchable)) return 'recycling';
  if (/earphone|headphone|audio/.test(searchable)) return 'audio';
  if (/keyboard/.test(searchable)) return 'keyboard';
  if (/laptop/.test(searchable)) return 'laptop';
  if (/plastic-bag-weaving/.test(searchable)) return 'craft';
  if (/plastic-bottle-pen-stand/.test(searchable)) return 'bottleHolder';
  if (/cardboard-phone-stand/.test(searchable)) return 'phoneStand';
  if (/phone|tablet/.test(searchable)) return 'phone';
  if (/plastic/.test(searchable)) return 'plastic';
  if (/paper|craft|cardboard|gift|decor|frame|cd|weav/.test(searchable)) return 'craft';
  return 'electronics';
};

const photoUrl = (source: string, width: number) => source.startsWith('http')
  ? source
  : photo(source, width);

// This guide follows a published plastic-bottle basket method: the bottle
// supplies the attached stakes and base, while bag strips form the weavers.
const basketStepGuides: IdeaStep[] = [
  {
    id: 'plastic-bag-weaving-1', position: 0, title: 'Choose and clean two bottles',
    description: 'Pick one sturdy, straight-sided drink bottle for the basket frame and a second bottle to make the inner liner. Wash both with dish soap, rinse them, remove labels and let them dry completely. Choose two clean bags in different colours so you can see the over-under pattern as you work.',
    image: { url: 'https://bouw.ru/userfiles/1571_2.jpg', source: 'https://bouw.ru/article/korzinki-iz-plastikovih-butilok-svoimi-rukami', alt: 'Finished handwoven baskets made from reused plastic bottles' },
  },
  {
    id: 'plastic-bag-weaving-2', position: 1, title: 'Cut an attached bottle frame',
    description: 'With an adult handling the scissors, remove the first bottle’s neck and shoulder so the straight lower body remains attached to its solid base. Mark roughly finger-width vertical bands around that body. Cut down each mark, stopping above the base so every band stays attached as an upright stake. Keep the stakes similar in width; an even count gives vertical colour columns, while an odd count creates a spiral pattern.',
    image: { url: 'https://i.pinimg.com/originals/89/c3/2c/89c32c3f350480da033d6dbf76661e0a.jpg', source: 'https://storage.googleapis.com/dizoyfqahpyyle/how-to-make-a-basket-using-plastic-bottles.html', alt: 'Photo sequence showing bottle preparation and plastic strip weaving' },
  },
  {
    id: 'plastic-bag-weaving-3', position: 2, title: 'Make long, even bag strips',
    description: 'Flatten one dry bag and smooth out its folds. Cut away the handles and bottom seam, then start at one open edge and spiral upward to make one long strip about 2 cm wide. Repeat with the second colour. Keep the width fairly even; very narrow strips tear, while very wide ones are hard to weave.',
    image: { url: 'https://prod-cms.scouts.org.uk/media/14508/now-we-re-going-to-turn-these-rectangles-into-long-strips.png', source: 'https://www.scouts.org.uk/activities/weave-goodbye-to-waste/', alt: 'Diagram showing how to cut a plastic bag into one continuous spiral strip' },
  },
  {
    id: 'plastic-bag-weaving-4', position: 3, title: 'Anchor the two coloured weavers',
    description: 'Take the end of the first strip and tuck it behind one upright stake, leaving a short tail on the left and the long working length on the right. Tuck the second colour behind the neighbouring stake. Keep both tails on the outside and hold them in place with your fingers; the first woven turns will lock them.',
    image: { url: 'https://content.instructables.com/FQT/GG0D/IDZSJLPO/FQTGG0DIDZSJLPO.jpg?auto=webp&fit=bounds&frame=1&height=1024&width=1024', source: 'https://www.instructables.com/Plastic-Yarn-out-of-Plastic-Bags/', alt: 'Long plastic bag strips prepared for weaving' },
  },
  {
    id: 'plastic-bag-weaving-5', position: 4, title: 'Weave one complete first row',
    description: 'Work from left to right around the bottle. Take the left-hand strip across the outside of one stake, pass it behind the next stake and bring it back outside; then repeat with the other colour. Keep alternating the active strip and follow the same over-one, behind-one rhythm until you return to the start.',
    image: { url: 'https://bouw.ru/userfiles/1424_6.jpg', source: 'https://bouw.ru/article/korzinki-iz-plastikovih-butilok-svoimi-rukami', alt: 'Illustrated over-under weaving pattern for plastic strips around basket stakes' },
  },
  {
    id: 'plastic-bag-weaving-6', position: 5, title: 'Build the sides without stretching',
    description: 'Press the first row down toward the bottle base, then repeat the same alternating weave for each new row. Snug the strips against each other, but do not pull hard: stretched plastic narrows and can split. If a strip runs out, tuck the next strip into the same gap where the old one exits, then keep weaving.',
    image: { url: 'https://i.pinimg.com/originals/89/c3/2c/89c32c3f350480da033d6dbf76661e0a.jpg', source: 'https://storage.googleapis.com/dizoyfqahpyyle/how-to-make-a-basket-using-plastic-bottles.html', alt: 'Basket sides being formed by weaving strips around bottle stakes' },
  },
  {
    id: 'plastic-bag-weaving-7', position: 6, title: 'Finish the rim and fit the liner',
    description: 'Stop weaving with about a thumb-width of each stake still visible. Fold each stake inward over the top row and tuck its end into the weave; trim only the excess, and ask an adult to blunt any sharp corner. Cut the second bottle just below the rim height and ease it inside as a smooth liner—do not force it.',
    image: { url: 'https://2.bp.blogspot.com/-dGWlEpC6efs/Ud97WcPFwLI/AAAAAAAAAac/1WlNgIY3jfw/s1600/keranjang%2Bbotol%2Bbekas%2Bcara.jpg', source: 'https://lovaliacrafty.blogspot.com/2015/11/daur-ulang-keranjang-dari-botol-bekas.html', alt: 'Completed basket made from a cut bottle with woven sides' },
  },
  {
    id: 'plastic-bag-weaving-8', position: 7, title: 'Trim, check, and choose a safe use',
    description: 'Tuck or trim loose strip ends so nothing catches fingers or clothing. Set the basket on a flat table and press each side gently to check that the base stays level and the stakes remain woven in. Use it for light, dry items such as pens or yarn; do not use it for food, hot items, liquids, children’s toys or heavy loads.',
    image: { url: 'https://bouw.ru/userfiles/1632_1.jpg', source: 'https://englishpromo.ru/2019/12/korzinka-iz-plastikovoj-butilki-svoimi-rukami/', alt: 'Finished woven bottle baskets suitable for light storage' },
  },
];

function expandStep(text: string, ideaTitle: string, theme: string) {
  const action = text.replace(/[.!?]+$/, '');
  const lower = text.toLowerCase();
  if (/separate|sort|group|collect/.test(lower)) {
    return `${action}. Keep each type of item in a clearly marked group so reusable devices, cables and batteries do not get mixed into household waste. Do not dismantle equipment or handle a swollen or leaking battery. Confirm the receiving recycler accepts each item before you travel.`;
  }
  if (/plan|sketch|draw|arrange|lay out|choose a short|select|measure|space|position/.test(lower)) {
    return `${action}. Set the pieces out on a clear surface before attaching anything, then check the size, spacing and order from the place where the finished project will be used. This dry run makes it easy to spot missing materials or an awkward fit while everything can still be moved.`;
  }
  if (/do not|never|avoid|reject|exclude|stop using/.test(lower)) {
    return `${action}. Treat this as a safety stop, not a step to work around: leave the item disconnected and keep it away from children, heat and flammable materials. Do not try another repair method or hide the damage. Ask a qualified repairer or authorized recycler to advise on the next safe option.`;
  }
  if (/shut down|power off|unplug|disconnect/.test(lower)) {
    return `${action}. Confirm the device is fully off and separated from its charger or other power source before touching it. Keep liquids and loose metal objects away from the work area, and wait for the device to cool if it has been in use. Continue only when the outside looks undamaged and dry.`;
  }
  if (/firmware|password|trusted .* app|settings|official system/.test(lower)) {
    return `${action}. Follow the maker's instructions for the exact model and use its official settings or support page rather than an unknown download. Keep account details private, save any settings the owner needs first, and do not interrupt an update once it starts.`;
  }
  if (/charg|charger|charging/.test(lower)) {
    return `${action}. Use a compatible, undamaged charger on a hard, ventilated surface and keep the cable clear of walkways. Stay nearby for the first few minutes and check that the device remains cool. Disconnect it and seek help if you notice heat, swelling, a smell or visible damage.`;
  }
  if (/cut|trim|punch|mark|trace|fold/.test(lower)) {
    return `${action}. Work on a flat, well-lit surface and measure the fit before making a permanent cut or fold. Keep fingers clear of the cutting path, use blunt scissors for simple craft materials, and ask an adult to handle any sharp tool. Check the piece against the design before moving on.`;
  }
  if (/wash|clean|wipe|brush|dry/.test(lower)) {
    const cleaning = theme === 'plastic' || theme === 'bottleHolder'
      ? 'Wash reusable plastic with mild soap and clean water, then rinse away any soap.'
      : theme === 'phone' || theme === 'laptop' || theme === 'audio' || theme === 'keyboard' || theme === 'electronics'
        ? 'Use a soft, dry cloth on electronic surfaces; never pour liquid into ports, keys or openings.'
        : 'Remove dirt gently with the dry or mild cleaning method suitable for the material.';
    return `${action}. ${cleaning} Let the item dry fully before assembly so labels, paper and adhesives stay secure. Check that no residue, sharp edge or loose part remains before continuing.`;
  }
  if (/inspect|check|look|confirm|test|try|verify|monitor|restart/.test(lower)) {
    return `${action}. Change one thing at a time so you can tell whether the result comes from the device, its cable, its settings or its surroundings. Note what you observe and compare it with the expected result. If you notice heat, a damaged battery, exposed wire, liquid or a burning smell, stop and get qualified help.`;
  }
  if (/back up|save|remove personal|sign out|factory-reset/.test(lower)) {
    return `${action}. Protect the owner's files and accounts before changing settings or handing the device to someone else. Use a trusted backup destination and open a few copied files to make sure they are readable. Keep passwords private, and do not erase anything until the owner has confirmed the backup.`;
  }
  if (/glue|attach|secure|reinforce|fit|thread|wrap|connect|install|set a new|label|arrange|place|add|use|choose|select|separate|sort|store|hang|fill|apply|restart|update/.test(lower)) {
    const context = (theme === 'plastic' || theme === 'bottleHolder') && /soil|plant|water/.test(lower)
      ? 'Keep the planter light, use potting mix rather than garden soil, and set it on a waterproof tray until you know that excess water drains safely.'
      : theme === 'plastic' || theme === 'bottleHolder'
      ? 'Use only clean, dry packaging that never held chemicals, and finish every cut edge before it can be touched.'
      : theme === 'electronics' || theme === 'laptop' || theme === 'phone' || theme === 'audio' || theme === 'keyboard'
        ? 'Keep the device disconnected from power while you work, and handle only its external surfaces or the inert parts named in the guide.'
        : 'Lay the parts out first and make small adjustments before fixing anything in place; this keeps the finished project neat and easier to reuse.';
    return `${action}. ${context} Work slowly and use only the materials listed for this guide. Pause to check alignment, stability and the finish before moving to the next step; if the result feels loose or unsafe, correct it now rather than covering the problem.`;
  }
  return `${action}. Take this one part of “${ideaTitle}” at a time, with the materials close by and the work area clear. Compare the result with the previous step before moving on, and make small corrections while the parts are still easy to adjust. Stop if you find damage or an unsafe condition.`;
}

function stepTitle(text: string) {
  const sentence = text.replace(/[.!?]+$/, '');
  return sentence.length > 56 ? `${sentence.slice(0, 53).trimEnd()}…` : sentence;
}

export const ideas: Idea[] = ideaRows.map(([slug, title, description, difficulty, materials, steps, tags, caution]) => {
  const theme = ideaTheme(slug, tags);
  const images = ideaPhotoGroups[theme];
  return {
  slug, title, description, difficulty,
  safetyNotes: caution ?? 'Disconnect power before handling. Stop if you find a damaged battery, exposed conductor, sharp part, heat, unusual smell or liquid damage; get qualified help.',
  materials: materials.split(', '),
  tags: tags.split(','),
  coverImage: slug === 'plastic-bag-weaving'
    ? { url: 'https://bouw.ru/userfiles/1571_2.jpg', source: 'https://bouw.ru/article/korzinki-iz-plastikovih-butilok-svoimi-rukami', alt: 'Completed baskets woven from recycled plastic bottles' }
    : { url: photoUrl(images[0], 1200) },
  ...(slug === 'plastic-bag-weaving' ? { references: [
    { label: 'Plastic Bottle Baskets — weaving instructions by Caroline Gregson', url: 'https://bluecoatdisplaycentre.com/outreach/wp-content/uploads/sites/3/2021/04/Recycled-Plastic-Basket-Weaving-Instructions-Caroline-Gregson.pdf' },
    { label: 'Scouts UK — cutting a plastic bag into a continuous strip', url: 'https://www.scouts.org.uk/activities/weave-goodbye-to-waste/' },
  ] } : {}),
  steps: slug === 'plastic-bag-weaving' ? basketStepGuides : steps.split('|').map((text, index) => {
    return {
      id: `${slug}-${index + 1}`,
      position: index,
      title: stepTitle(text),
      description: expandStep(text, title, theme),
      image: { url: photoUrl(images[(index + 1) % images.length], 700) },
    };
  }),
  };
});
