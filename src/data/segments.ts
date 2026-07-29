import { localAssets, modelAssets } from './assets'
import type { SegmentConfig, SegmentRoute } from './types'

export const segmentRoutes: SegmentRoute[] = ['luxury', 'cafe', 'fast-casual', 'social-dining']

export const segments: SegmentConfig[] = [
  {
    id: 'luxury-dining',
    route: 'luxury',
    label: { en: 'Fine Dining & Luxury', ka: 'ფაინ დაინინგი და პრემიუმი' },
    shortLabel: { en: 'Luxury', ka: 'პრემიუმი' },
    heading: { en: 'Fine Dining, Made Interactive.', ka: 'ფაინ დაინინგი, ინტერაქტიულად.' },
    kicker: { en: 'Custom identity for quiet service', ka: 'ინდივიდუალური იდენტობა მშვიდი სერვისისთვის' },
    conceptLabel: { en: 'Luxury dining design study.', ka: 'პრემიუმ რესტორნის დიზაინ-მიმართულება.' },
    body: {
      en: 'A spacious menu direction for restaurants where atmosphere, plating, and service details matter as much as the order.',
      ka: 'ფართო, მშვიდი მენიუს მიმართულება რესტორნებისთვის, სადაც გარემო, კერძის პრეზენტაცია და სერვისის დეტალები თანაბრად მნიშვნელოვანია.',
    },
    demoUrl: 'https://restaurant-ar.pages.dev/?tenant=b-main',
    primaryCta: { en: 'Open Luxury Demo', ka: 'პრემიუმ დემოს გახსნა' },
    secondaryCta: { en: 'See 3D Dessert', ka: 'დესერტის 3D ნახვა' },
    categories: [
      { en: 'Signature', ka: 'საფირმო' },
      { en: 'Mains', ka: 'მთავარი' },
      { en: 'Dessert', ka: 'დესერტი' },
    ],
    images: {
      hero: localAssets.chapters.luxury.hero,
      support: localAssets.chapters.luxury.support,
    },
    theme: {
      background: '#FFFCF9',
      surface: '#FFF7F2',
      ink: '#302929',
      muted: '#705B5B',
      accent: '#B77A72',
      accent2: '#C5A46D',
      accent3: '#642F38',
      fontClass: 'themeSerif',
      layout: 'editorial',
    },
    items: [
      {
        id: 'luxury-trout',
        name: { en: 'Pomegranate Trout', ka: 'ბროწეულის კალმახი' },
        description: {
          en: 'Concept dish card for a composed seafood course with editorial pacing and calm detail.',
          ka: 'კონცეპტუალური კერძის ბარათი ზღვის პროდუქტის კურსისთვის, მშვიდი დეტალებით და სარედაქციო რიტმით.',
        },
        price: '38 ₾',
        category: { en: 'Signature', ka: 'საფირმო' },
        image: localAssets.chapters.luxury.trout,
      },
      {
        id: 'luxury-salad',
        name: { en: 'Greek Garden Salad', ka: 'ბერძნული ბაღის სალათი' },
        description: {
          en: 'Illustrative vegetable course showing how lighter plates can remain scannable.',
          ka: 'ილუსტრაციული ბოსტნეულის კურსი, სადაც მსუბუქი კერძიც მარტივად იკითხება.',
        },
        price: '24 ₾',
        category: { en: 'Mains', ka: 'მთავარი' },
        image: localAssets.chapters.luxury.salad,
      },
      {
        id: 'luxury-dessert',
        name: { en: 'Spiral Dessert', ka: 'სპირალური დესერტი' },
        description: {
          en: 'Design-study dessert card using local food photography; price remains illustrative.',
          ka: 'დიზაინ-მიმართულების დესერტის ბარათი ადგილობრივი საკვების ფოტოთი; ფასი ილუსტრაციულია.',
        },
        price: '27 ₾',
        category: { en: 'Dessert', ka: 'დესერტი' },
        image: localAssets.chapters.luxury.dessert,
      },
      {
        id: 'luxury-croissant-3d',
        name: { en: 'Chocolate Croissant', ka: 'შოკოლადის კრუასანი' },
        description: {
          en: 'Real shared BetaReal 3D model available as the chapter interaction example.',
          ka: 'რეალური BetaReal 3D მოდელი, ხელმისაწვდომი ამ თავის ინტერაქციის მაგალითისთვის.',
        },
        price: '2.5 ₾',
        category: { en: 'Dessert', ka: 'დესერტი' },
        image: modelAssets.croissant.poster,
        model: modelAssets.croissant,
        badge: { en: '3D ready', ka: '3D მზადაა' },
      },
    ],
  },
  {
    id: 'modern-cafe',
    route: 'cafe',
    label: { en: 'Modern Café & Lifestyle', ka: 'თანამედროვე კაფე და ცხოვრების სტილი' },
    shortLabel: { en: 'Modern Café', ka: 'კაფე' },
    heading: { en: 'Fresh Design for Modern Dining.', ka: 'ახალი დიზაინი თანამედროვე კაფეებისთვის.' },
    kicker: { en: 'Daylight, rhythm, and readable choices', ka: 'დღის შუქი, რიტმი და მარტივად წაკითხვადი არჩევანი' },
    conceptLabel: { en: 'Modern café direction.', ka: 'თანამედროვე კაფეს მიმართულება.' },
    body: {
      en: 'A lighter lifestyle menu system for brunch, coffee, takeaway, and mobile browsing between tables.',
      ka: 'მსუბუქი მენიუს სისტემა ბრანჩისთვის, ყავისთვის, გატანისთვის და მობილურით სწრაფი დათვალიერებისთვის.',
    },
    demoUrl: 'https://monday-greens.betareal.ge',
    primaryCta: { en: 'Open Café Demo', ka: 'კაფეს დემოს გახსნა' },
    secondaryCta: { en: 'Explore Menu Style', ka: 'მენიუს სტილის ნახვა' },
    categories: [
      { en: 'Brunch', ka: 'ბრანჩი' },
      { en: 'Coffee', ka: 'ყავა' },
      { en: 'Bakery', ka: 'საცხობი' },
    ],
    images: {
      hero: localAssets.chapters.cafe.hero,
      support: localAssets.chapters.cafe.support,
    },
    theme: {
      background: '#F4F3EA',
      surface: '#FFFDF4',
      ink: '#263029',
      muted: '#647068',
      accent: '#70836A',
      accent2: '#C89472',
      accent3: '#31483A',
      fontClass: 'themeClean',
      layout: 'cafe',
    },
    verifiedClientNote: {
      en: 'Includes visual reference from Monday Greens, verified BetaReal client work.',
      ka: 'გამოყენებულია Monday Greens-ის ვიზუალური რეფერენსი, BetaReal-ის დადასტურებული კლიენტის ნამუშევარი.',
    },
    items: [
      {
        id: 'cafe-chia',
        name: { en: 'Chia Fruit Bowl', ka: 'ჩიას ხილის ბოული' },
        description: {
          en: 'Verified Monday Greens food reference used for an illustrative brunch card.',
          ka: 'Monday Greens-ის დადასტურებული საკვების რეფერენსი ილუსტრაციული ბრანჩის ბარათისთვის.',
        },
        price: '18 ₾',
        category: { en: 'Brunch', ka: 'ბრანჩი' },
        image: localAssets.chapters.cafe.chia,
      },
      {
        id: 'cafe-bagel',
        name: { en: 'Scrambled Bagel', ka: 'სქრემბლ ბეიგელი' },
        description: {
          en: 'Verified Monday Greens food reference for a compact bakery-and-brunch card.',
          ka: 'Monday Greens-ის დადასტურებული საკვების რეფერენსი კომპაქტური საცხობისა და ბრანჩის ბარათისთვის.',
        },
        price: '16 ₾',
        category: { en: 'Bakery', ka: 'საცხობი' },
        image: localAssets.chapters.cafe.bagel,
      },
      {
        id: 'cafe-coffee',
        name: { en: 'Iced Coffee', ka: 'ცივი ყავა' },
        description: {
          en: 'Verified Monday Greens drink reference with bright, appetite-forward imagery.',
          ka: 'Monday Greens-ის დადასტურებული სასმლის რეფერენსი ნათელი, მადისაღმძვრელი ვიზუალით.',
        },
        price: '9 ₾',
        category: { en: 'Coffee', ka: 'ყავა' },
        image: localAssets.chapters.cafe.icedCoffee,
      },
      {
        id: 'cafe-croissant',
        name: { en: 'Chocolate Croissant', ka: 'შოკოლადის კრუასანი' },
        description: {
          en: 'Real shared BetaReal croissant model for a secondary 3D and AR interaction.',
          ka: 'რეალური BetaReal კრუასანის მოდელი დამატებითი 3D და AR ინტერაქციისთვის.',
        },
        price: '2.5 ₾',
        category: { en: 'Bakery', ka: 'საცხობი' },
        image: modelAssets.croissant.poster,
        model: modelAssets.croissant,
        badge: { en: '3D ready', ka: '3D მზადაა' },
      },
    ],
  },
  {
    id: 'premium-fast-casual',
    route: 'fast-casual',
    label: { en: 'Premium Fast Casual', ka: 'პრემიუმ სწრაფი კვება' },
    shortLabel: { en: 'Fast Casual', ka: 'სწრაფი კვება' },
    heading: { en: 'Fast Food Without Generic Design.', ka: 'სწრაფი კვება სტანდარტული დიზაინის გარეშე.' },
    kicker: { en: 'Speed, clarity, and product confidence', ka: 'სისწრაფე, სიცხადე და პროდუქტის დამაჯერებლობა' },
    conceptLabel: { en: 'Premium fast-casual design study.', ka: 'პრემიუმ სწრაფი კვების დიზაინ-მიმართულება.' },
    body: {
      en: 'A bold menu preview for burger, combo, and customization flows where guests need clarity fast.',
      ka: 'მკვეთრი მენიუს პრევიუ ბურგერის, კომბოსა და მორგების სცენარებისთვის, სადაც სტუმარს სწრაფად სჭირდება სიცხადე.',
    },
    demoUrl: 'https://restaurant-ar.pages.dev/?tenant=burger-lions-main',
    primaryCta: { en: 'Open Fast Casual Demo', ka: 'სწრაფი კვების დემოს გახსნა' },
    secondaryCta: { en: 'Rotate the Burger', ka: 'ბურგერის დატრიალება' },
    categories: [
      { en: 'Burgers', ka: 'ბურგერები' },
      { en: 'Combos', ka: 'კომბოები' },
      { en: 'Sides', ka: 'საიდები' },
    ],
    images: {
      hero: localAssets.chapters.fastCasual.doubleSmashed,
      support: localAssets.chapters.fastCasual.giantBurger,
    },
    theme: {
      background: '#F8F1E4',
      surface: '#FFF9ED',
      ink: '#191919',
      muted: '#5E5147',
      accent: '#D43A2F',
      accent2: '#F16A32',
      accent3: '#F3C64A',
      fontClass: 'themeHeavy',
      layout: 'poster',
    },
    items: [
      {
        id: 'fast-bigburger',
        name: { en: 'BigBurger', ka: 'ბიგბურგერი' },
        description: {
          en: '600g beef, 5 layers cheddar cheese, 4 layers bacon, special sauce, pickles, iceberg lettuce, burger bun.',
          ka: 'ხორცი 600 გრ, ყველი ჩედარი 5 ფენა, ბეკონი 4 ფენა, სპეც სოუსი, მჟავე კიტრი, აისბერგი, ბურგერის ფუნთუშა.',
        },
        price: '14 ₾',
        category: { en: 'Burgers', ka: 'ბურგერები' },
        image: modelAssets.burger.poster,
        model: modelAssets.burger,
        badge: { en: 'Real 3D', ka: 'რეალური 3D' },
      },
      {
        id: 'fast-double',
        name: { en: 'Double Smashed', ka: 'ორმაგი სმეში' },
        description: {
          en: 'Fast-casual product image reused as a design reference for high-clarity cards.',
          ka: 'სწრაფი კვების პროდუქტის ფოტო, გამოყენებული როგორც მკაფიო ბარათის დიზაინ-რეფერენსი.',
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
          ka: 'საიდის ბარათი სწრაფი სკანირებით და მკაფიო მოქმედებებით.',
        },
        price: '11 ₾',
        category: { en: 'Sides', ka: 'საიდები' },
        image: localAssets.chapters.fastCasual.wings,
      },
    ],
  },
  {
    id: 'social-dining',
    route: 'social-dining',
    label: { en: 'Social Dining', ka: 'სოციალური სივრცეები' },
    shortLabel: { en: 'Social Dining', ka: 'სივრცეები' },
    heading: { en: 'Built for Busy Places.', ka: 'შექმნილია დატვირთული სივრცეებისთვის.' },
    kicker: { en: 'Large targets, search, and quick movement', ka: 'დიდი ღილაკები, ძებნა და სწრაფი გადაადგილება' },
    conceptLabel: { en: 'Social dining design study.', ka: 'სოციალური სივრცის დიზაინ-მიმართულება.' },
    body: {
      en: 'An industrial menu system for high-volume ordering moments, with big categories and immediate product recognition.',
      ka: 'ინდუსტრიული მენიუს სისტემა მაღალი დატვირთვის შეკვეთის მომენტებისთვის, დიდი კატეგორიებით და პროდუქტის სწრაფი ამოცნობით.',
    },
    demoUrl: 'https://restaurant-ar.pages.dev/?tenant=pipes-burger-main',
    primaryCta: { en: 'Open Social Demo', ka: 'სოციალური სივრცის დემოს გახსნა' },
    secondaryCta: { en: 'See the AR Experience', ka: 'AR გამოცდილების ნახვა' },
    categories: [
      { en: 'Search', ka: 'ძებნა' },
      { en: 'Burgers', ka: 'ბურგერები' },
      { en: 'Sides', ka: 'საიდები' },
    ],
    images: {
      hero: localAssets.chapters.social.signature,
      support: localAssets.chapters.social.cheeseburger,
    },
    theme: {
      background: '#E9E3D7',
      surface: '#F5F0E6',
      ink: '#171717',
      muted: '#5F5950',
      accent: '#F05A28',
      accent2: '#F4C542',
      accent3: '#2878C8',
      fontClass: 'themeCondensed',
      layout: 'industrial',
    },
    items: [
      {
        id: 'social-cheeseburger',
        name: { en: 'Cheeseburger', ka: 'ჩიზბურგერი' },
        description: {
          en: 'With marinated onions, cheddar cheese, tomato, lettuce, gherkins and spicy homemade mayo.',
          ka: 'ხახვის მარინადი, პომიდორი, ყველი ჩედარი, სალათის ფოთოლი, მჟავე კიტრი და ცხარე საფირმო მაიონეზი.',
        },
        price: '16.39 ₾',
        category: { en: 'Burgers', ka: 'ბურგერები' },
        image: localAssets.chapters.social.cheeseburger,
      },
      {
        id: 'social-signature',
        name: { en: 'Pipes Signature Burger', ka: 'პაიპსი საფირმო ბურგერი' },
        description: {
          en: 'Cheddar inside a half-pound patty, bacon, onion jam, gherkins, lettuce, tomato and sauce.',
          ka: 'ყველი ჩედარი პეტის შუაგულში, ბეკონი, ხახვის ჯემი, მჟავე კიტრი, სალათის ფოთოლი, პომიდორი და სოუსი.',
        },
        price: '20.79 ₾',
        category: { en: 'Burgers', ka: 'ბურგერები' },
        image: localAssets.chapters.social.signature,
        badge: { en: 'Popular in demo data', ka: 'გამორჩეული დემო მონაცემებში' },
      },
      {
        id: 'social-hotdog',
        name: { en: 'Hot Dog', ka: 'ჰოთ დოგი' },
        description: {
          en: 'Real shared BetaReal hot dog model for a quick AR action from a busy menu card.',
          ka: 'რეალური BetaReal ჰოთ დოგის მოდელი სწრაფი AR მოქმედებისთვის დატვირთული მენიუს ბარათიდან.',
        },
        price: '4 ₾',
        category: { en: 'Sides', ka: 'საიდები' },
        image: modelAssets.hotDog.poster,
        model: modelAssets.hotDog,
        badge: { en: 'AR ready', ka: 'AR მზადაა' },
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
