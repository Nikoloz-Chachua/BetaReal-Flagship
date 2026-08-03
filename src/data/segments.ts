import { localAssets, modelAssets } from './assets'
import type { SegmentConfig, SegmentRoute } from './types'

export const segmentRoutes: SegmentRoute[] = ['luxury', 'cafe', 'fast-casual', 'social-dining']

export const segments: SegmentConfig[] = [
  {
    id: 'luxury-dining',
    route: 'luxury',
    label: { en: 'Fine Dining & Luxury', ka: 'მაღალი კლასის რესტორნები' },
    shortLabel: { en: 'Luxury', ka: 'პრემიუმ რესტორნები' },
    heading: { en: 'Fine Dining, Made Interactive.', ka: 'მაღალი კლასის რესტორანი — ახლა ინტერაქტიული.' },
    kicker: { en: 'Custom identity for quiet service', ka: 'დახვეწილი მომსახურებისთვის შექმნილი ინდივიდუალური იდენტობა' },
    conceptLabel: { en: 'Luxury dining design study.', ka: 'პრემიუმ რესტორნის დიზაინის კონცეფცია.' },
    body: {
      en: 'A spacious menu direction for restaurants where atmosphere, plating, and service details matter as much as the order.',
      ka: 'სივრცეზე ორიენტირებული, დახვეწილი მენიუს კონცეფცია რესტორნებისთვის, სადაც ატმოსფერო, კერძის გაფორმება და მომსახურების დეტალები შეკვეთაზე არანაკლებ მნიშვნელოვანია.',
    },
    demoUrl: 'https://restaurant-ar.pages.dev/?tenant=luxury',
    primaryCta: { en: 'Open Luxury Demo', ka: 'პრემიუმ დემოს გახსნა' },
    secondaryCta: { en: 'See 3D Dessert', ka: 'დესერტის 3D ნახვა' },
    categories: [
      { en: 'Signature', ka: 'საფირმო კერძები' },
      { en: 'Mains', ka: 'ძირითადი კერძები' },
      { en: 'Dessert', ka: 'დესერტები' },
    ],
    images: {
      hero: localAssets.chapters.luxury.hero,
      support: localAssets.chapters.luxury.support,
    },
    theme: {
      background: '#2A0813',
      surface: '#FFF2EA',
      ink: '#FFF6EC',
      muted: '#F2CBC7',
      accent: '#D9B46E',
      accent2: '#F2C9D1',
      accent3: '#7E2434',
      fontClass: 'themeSerif',
      layout: 'editorial',
    },
    items: [
      {
        id: 'luxury-beef-fillet',
        name: { en: 'Beef Fillet', ka: 'საქონლის ფილე' },
        description: {
          en: 'High-resolution Monday Greens plate reference for a crisp premium main card.',
          ka: 'Monday Greens-ის კერძის მაღალი გარჩევადობის ფოტო პრემიუმ კლასის ძირითადი კერძის ბარათისთვის.',
        },
        price: '24 ₾',
        category: { en: 'Mains', ka: 'ძირითადი კერძები' },
        image: localAssets.chapters.luxury.beefFillet,
      },
      {
        id: 'luxury-croissant-3d',
        name: { en: 'Chocolate Croissant', ka: 'შოკოლადის კრუასანი' },
        description: {
          en: 'Real shared BetaReal 3D model available as the chapter interaction example.',
          ka: 'BetaReal-ის რეალური 3D მოდელი, რომელიც ამ სექციაში ინტერაქტიულ ნიმუშადაა გამოყენებული.',
        },
        price: '2.5 ₾',
        category: { en: 'Dessert', ka: 'დესერტები' },
        image: modelAssets.croissant.poster,
        model: modelAssets.croissant,
        badge: { en: '3D ready', ka: 'ხელმისაწვდომია 3D-ში' },
      },
    ],
  },
  {
    id: 'modern-cafe',
    route: 'cafe',
    label: { en: 'Modern Café & Lifestyle', ka: 'თანამედროვე კაფე და ურბანული სტილი' },
    shortLabel: { en: 'Modern Café', ka: 'კაფე' },
    heading: { en: 'Fresh Design for Modern Dining.', ka: 'თანამედროვე კაფეს ახალი დიზაინი.' },
    kicker: { en: 'Daylight, rhythm, and readable choices', ka: 'დღის შუქი, რიტმი და ადვილად აღსაქმელი მენიუ' },
    conceptLabel: { en: 'Modern café direction.', ka: 'თანამედროვე კაფეს დიზაინის კონცეფცია.' },
    body: {
      en: 'A lighter lifestyle menu system for breakfast, coffee, takeaway, and mobile browsing between tables.',
      ka: 'მსუბუქი, თანამედროვე მენიუს სისტემა საუზმის, ყავისა და გატანის სერვისისთვის, რომელიც მობილურით სწრაფად და მარტივად ითვალიერება.',
    },
    demoUrl: 'https://monday-greens.betareal.ge',
    primaryCta: { en: 'Open Café Demo', ka: 'კაფეს დემოს გახსნა' },
    secondaryCta: { en: 'Explore Menu Style', ka: 'მენიუს სტილის ნახვა' },
    categories: [
      { en: 'Breakfast', ka: 'საუზმე' },
      { en: 'Main dishes', ka: 'მთავარი კერძები' },
      { en: 'Bakery', ka: 'საცხობი' },
    ],
    images: {
      hero: localAssets.chapters.cafe.hero,
      support: localAssets.chapters.cafe.support,
    },
    theme: {
      background: '#36a1b0',
      surface: '#ffffff',
      ink: '#0b2a30',
      muted: '#0b2a30',
      accent: '#0891b2',
      accent2: '#e6fbff',
      accent3: '#0e7490',
      fontClass: 'themeClean',
      layout: 'cafe',
    },
    verifiedClientNote: {
      en: 'Includes visual reference from Monday Greens, verified BetaReal client work.',
      ka: 'გამოყენებულია BetaReal-ის დადასტურებული კლიენტისთვის, Monday Greens-ისთვის შექმნილი ვიზუალური მასალა.',
    },
    items: [
      {
        id: 'cafe-croissant',
        name: { en: 'Chocolate Croissant', ka: 'შოკოლადის კრუასანი' },
        description: {
          en: 'Real shared BetaReal croissant model for a secondary 3D and AR interaction.',
          ka: 'BetaReal-ის კრუასანის რეალური მოდელი დამატებითი 3D და AR ინტერაქციისთვის.',
        },
        price: '2.5 ₾',
        category: { en: 'Bakery', ka: 'საცხობი' },
        image: modelAssets.croissant.poster,
        model: modelAssets.croissant,
        badge: { en: '3D ready', ka: 'ხელმისაწვდომია 3D-ში' },
      },
      {
        id: 'cafe-beef-steak',
        name: { en: 'Beef Steak', ka: 'საქონლის სტეიკი' },
        description: {
          en: 'Beef steak with mushrooms and cream sauce; verified Monday Greens model and menu price.',
          ka: 'საქონლის სტეიკი სოკოსა და ნაღების სოუსით — Monday Greens-ის დადასტურებული მოდელი და მენიუს ფასი.',
        },
        price: '56 ₾',
        category: { en: 'Main dishes', ka: 'მთავარი კერძები' },
        image: modelAssets.mondaySteak.poster,
        model: modelAssets.mondaySteak,
        badge: { en: 'Real Monday Greens 3D', ka: 'Monday Greens-ის რეალური 3D' },
      },
      {
        id: 'cafe-benedict-bacon',
        name: { en: 'Benedict with Bacon', ka: 'ბენედიქტი ბეკონით' },
        description: {
          en: 'Potato buns, bacon, Gouda, eggs, butter, cream cheese, avocado, mixed salad, and sesame.',
          ka: 'კარტოფილის ბანი, ბეკონი, გაუდა, კვერცხი, კარაქი, კრემ-ჩიზი, ავოკადო, მიქს სალათი და სეზამი.',
        },
        price: '28 ₾',
        category: { en: 'Breakfast', ka: 'საუზმე' },
        image: modelAssets.mondayBenedict.poster,
        model: modelAssets.mondayBenedict,
        badge: { en: 'Real Monday Greens 3D', ka: 'Monday Greens-ის რეალური 3D' },
      },
    ],
  },
  {
    id: 'premium-fast-casual',
    route: 'fast-casual',
    label: { en: 'Premium Fast Casual', ka: 'პრემიუმ სწრაფი მომსახურება' },
    shortLabel: { en: 'Fast Casual', ka: 'სწრაფი მომსახურება' },
    heading: { en: 'Fast Food Without Generic Design.', ka: 'სწრაფი კვება შაბლონური დიზაინის გარეშე.' },
    kicker: { en: 'Speed, clarity, and product confidence', ka: 'სისწრაფე, სიცხადე და პროდუქტის მკაფიო წარმოდგენა' },
    conceptLabel: { en: 'Premium fast-casual design study.', ka: 'პრემიუმ სწრაფი მომსახურების დიზაინის კონცეფცია.' },
    body: {
      en: 'A bold menu preview for burger, combo, and customization flows where guests need clarity fast.',
      ka: 'თამამი მენიუს ნიმუში ბურგერების, კომბოებისა და ინდივიდუალური არჩევანისთვის, სადაც სტუმარმა გადაწყვეტილება სწრაფად და მარტივად უნდა მიიღოს.',
    },
    demoUrl: 'https://restaurant-ar.pages.dev/?tenant=mugsy-main',
    primaryCta: { en: 'Open Fast Casual Demo', ka: 'სწრაფი მომსახურების დემოს გახსნა' },
    secondaryCta: { en: 'Rotate the Burger', ka: 'ბურგერის დატრიალება' },
    categories: [
      { en: 'Burgers', ka: 'ბურგერები' },
      { en: 'Combos', ka: 'კომბოები' },
      { en: 'Sides', ka: 'გარნირები' },
    ],
    images: {
      hero: localAssets.chapters.fastCasual.doubleSmashed,
      support: localAssets.chapters.fastCasual.giantBurger,
    },
    theme: {
      background: '#F3D19D',
      surface: '#FFF3DA',
      ink: '#22140B',
      muted: '#6A3C23',
      accent: '#D63A25',
      accent2: '#F58233',
      accent3: '#F6C544',
      fontClass: 'themeHeavy',
      layout: 'poster',
    },
    items: [
      {
        id: 'fast-bigburger',
        name: { en: 'BigBurger', ka: 'ბიგბურგერი' },
        description: {
          en: '600g beef, 5 layers cheddar cheese, 4 layers bacon, special sauce, pickles, iceberg lettuce, burger bun.',
          ka: 'საქონლის ხორცი — 600 გ, ჩედარი — 5 ფენა, ბეკონი — 4 ფენა, სპეციალური სოუსი, მჟავე კიტრი, აისბერგის სალათი და ბურგერის ფუნთუშა.',
        },
        price: '14 ₾',
        category: { en: 'Burgers', ka: 'ბურგერები' },
        image: modelAssets.burger.poster,
        model: modelAssets.burger,
        badge: { en: 'Real 3D', ka: 'რეალური 3D' },
      },
      {
        id: 'fast-double',
        name: { en: 'Double Smashed', ka: 'ორმაგი სმეშ-ბურგერი' },
        description: {
          en: 'Fast-casual product image reused as a design reference for high-clarity cards.',
          ka: 'სწრაფი მომსახურების პროდუქტის ფოტო, გამოყენებული მკაფიო და ადვილად აღსაქმელი ბარათის დიზაინის ნიმუშად.',
        },
        price: '17 ₾',
        category: { en: 'Combos', ka: 'კომბოები' },
        image: localAssets.chapters.fastCasual.doubleSmashed,
      },
      {
        id: 'fast-wings',
        name: { en: 'Chicken Wings', ka: 'ქათმის ფრთები' },
        description: {
          en: 'Tactile side-card treatment with fast scanning and obvious actions.',
          ka: 'გარნირის ადვილად აღსაქმელი ბარათი მკაფიო მოქმედებების ღილაკებით.',
        },
        price: '11 ₾',
        category: { en: 'Sides', ka: 'გარნირები' },
        image: localAssets.chapters.fastCasual.wings,
      },
    ],
  },
  {
    id: 'social-dining',
    route: 'social-dining',
    label: { en: 'Social Dining', ka: 'თავშეყრის სივრცეები' },
    shortLabel: { en: 'Social Dining', ka: 'თავშეყრის სივრცეები' },
    heading: { en: 'Built for Busy Places.', ka: 'დატვირთული სივრცეებისთვის შექმნილი.' },
    kicker: { en: 'Large targets, search, and quick movement', ka: 'დიდი ღილაკები, ძიება და სწრაფი ნავიგაცია' },
    conceptLabel: { en: 'Social dining design study.', ka: 'თავშეყრის სივრცის დიზაინის კონცეფცია.' },
    body: {
      en: 'An industrial menu system for high-volume ordering moments, with big categories and immediate product recognition.',
      ka: 'ინდუსტრიული სტილის მენიუს სისტემა მაღალი დატვირთვისას შეკვეთების მისაღებად, დიდი კატეგორიებითა და კერძების მყისიერად ამოსაცნობი ვიზუალებით.',
    },
    demoUrl: 'https://restaurant-ar.pages.dev/?tenant=social-dining',
    primaryCta: { en: 'Open Social Demo', ka: 'თავშეყრის სივრცის დემოს გახსნა' },
    secondaryCta: { en: 'See the AR Experience', ka: 'AR გამოცდილების გამოცდა' },
    categories: [
      { en: 'Search', ka: 'ძიება' },
      { en: 'Burgers', ka: 'ბურგერები' },
      { en: 'Sides', ka: 'გარნირები' },
    ],
    images: {
      hero: localAssets.chapters.social.signature,
      support: localAssets.chapters.social.cheeseburger,
    },
    theme: {
      background: '#2D3338',
      surface: '#F2EEE4',
      ink: '#111317',
      muted: '#4F565C',
      accent: '#F2632C',
      accent2: '#2D7FC3',
      accent3: '#121820',
      fontClass: 'themeCondensed',
      layout: 'industrial',
    },
    items: [
      {
        id: 'social-cheeseburger',
        name: { en: 'Cheeseburger', ka: 'ჩიზბურგერი' },
        description: {
          en: 'With marinated onions, cheddar cheese, tomato, lettuce, gherkins and spicy homemade mayo.',
          ka: 'მარინირებული ხახვი, ჩედარი, პომიდორი, სალათის ფოთოლი, მჟავე კიტრი და ცხარე საფირმო მაიონეზი.',
        },
        price: '16.39 ₾',
        category: { en: 'Burgers', ka: 'ბურგერები' },
        image: localAssets.chapters.social.cheeseburger,
      },
      {
        id: 'social-signature',
        name: { en: 'Pipes Signature Burger', ka: 'Pipes-ის საფირმო ბურგერი' },
        description: {
          en: 'Cheddar inside a half-pound patty, bacon, onion jam, gherkins, lettuce, tomato and sauce.',
          ka: 'დაახლოებით 225-გრამიან კატლეტში მოთავსებული ჩედარი, ბეკონი, ხახვის ჯემი, მჟავე კიტრი, სალათის ფოთოლი, პომიდორი და სოუსი.',
        },
        price: '20.79 ₾',
        category: { en: 'Burgers', ka: 'ბურგერები' },
        image: localAssets.chapters.social.signature,
        badge: { en: 'Popular in demo data', ka: 'პოპულარული არჩევანი დემოში' },
      },
      {
        id: 'social-hotdog',
        name: { en: 'Hot Dog', ka: 'ჰოთ-დოგი' },
        description: {
          en: 'Real shared BetaReal hot dog model for a quick AR action from a busy menu card.',
          ka: 'BetaReal-ის ჰოთ-დოგის რეალური მოდელი, რომელიც დატვირთული მენიუს ბარათიდან AR-ის სწრაფად გასახსნელადაა განკუთვნილი.',
        },
        price: '4 ₾',
        category: { en: 'Sides', ka: 'გარნირები' },
        image: modelAssets.hotDog.poster,
        model: modelAssets.hotDog,
        badge: { en: 'AR ready', ka: 'ხელმისაწვდომია AR-ში' },
      },
    ],
  },
]

export const segmentsByRoute = Object.fromEntries(segments.map((segment) => [segment.route, segment])) as Record<
  SegmentRoute,
  SegmentConfig
>

export const segmentsByHash = Object.fromEntries(segments.map((segment) => [segment.id, segment])) as Record<
  string,
  SegmentConfig
>

export const isSegmentRoute = (value: string | null | undefined): value is SegmentRoute =>
  Boolean(value && segmentRoutes.includes(value as SegmentRoute))
