const localAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

export const localAssets = {
  logos: {
    official: localAsset('/assets/brand/betareal-logo-official.png'),
  },
  chapters: {
    luxury: {
      hero: localAsset('/assets/chapters/luxury/interior-hero-maps.webp'),
      support: localAsset('/assets/chapters/luxury/interior-terrace.jpg'),
      beefStroganoff: localAsset('/assets/chapters/luxury/dishes/mg-beef-stroganoff.webp'),
      beefFillet: localAsset('/assets/chapters/luxury/dishes/mg-beef-fillet.png'),
      gazpacho: localAsset('/assets/chapters/luxury/dishes/mg-gazpacho.webp'),
    },
    cafe: {
      hero: localAsset('/assets/chapters/cafe/mg-hero-1.webp'),
      support: localAsset('/assets/chapters/cafe/mg-hero-2.webp'),
      detail: localAsset('/assets/chapters/cafe/mg-hero-3.webp'),
      chia: localAsset('/assets/chapters/cafe/items/chia-fruit-bowl.webp'),
      bagel: localAsset('/assets/chapters/cafe/items/scrambled-bagel.webp'),
      icedCoffee: localAsset('/assets/chapters/cafe/items/iced-coffee.webp'),
    },
    fastCasual: {
      doubleSmashed: localAsset('/assets/chapters/fast-casual/double-smashed.webp'),
      giantBurger: localAsset('/assets/chapters/fast-casual/giant-burger.webp'),
      wings: localAsset('/assets/chapters/fast-casual/chicken-wings-6pcs.webp'),
    },
    social: {
      cheeseburger: localAsset('/assets/chapters/social/cheeseburger.webp'),
      signature: localAsset('/assets/chapters/social/pipes-signature-burger.webp'),
      quesadilla: localAsset('/assets/chapters/social/quesadilla.webp'),
    },
  },
} as const

export const modelAssets = {
  burger: {
    name: 'BigBurger',
    nameKa: 'ბიგბურგერი',
    glb: 'https://pub-3c68559de18f4aee94d127e180937bdd.r2.dev/druidi_balanced_30k_2k.glb',
    usdz: 'https://pub-3c68559de18f4aee94d127e180937bdd.r2.dev/druidi_balanced_30k_2k.usdz',
    poster: localAsset('/assets/models/burger_poster.webp'),
    scale: 1.5181,
  },
  hotDog: {
    name: 'Hot Dog',
    nameKa: 'ჰოთ დოგი',
    glb: 'https://pub-3c68559de18f4aee94d127e180937bdd.r2.dev/hot_dog_draco.glb',
    usdz: 'https://pub-3c68559de18f4aee94d127e180937bdd.r2.dev/hot_dog.usdz',
    poster: localAsset('/assets/models/hot_dog_poster.webp'),
    scale: 0.9312,
  },
  croissant: {
    name: 'Croissant',
    nameKa: 'კრუასანი',
    glb: 'https://pub-3c68559de18f4aee94d127e180937bdd.r2.dev/croissant_draco.glb',
    usdz: 'https://pub-3c68559de18f4aee94d127e180937bdd.r2.dev/croissant.usdz',
    poster: localAsset('/assets/models/croissant_poster.webp'),
    scale: 0.9,
  },
} as const
