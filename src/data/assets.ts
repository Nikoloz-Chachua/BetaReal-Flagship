const localAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

export const localAssets = {
  logos: {
    official: localAsset('/assets/brand/betareal-logo-official.png'),
  },
  chapters: {
    luxury: {
      hero: localAsset('/assets/chapters/luxury/interior-enhanced-wide.webp'),
      support: localAsset('/assets/chapters/luxury/interior-enhanced-portrait.webp'),
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
    maxPolarAngleDeg: 87,
  },
  hotDog: {
    name: 'Hot Dog',
    nameKa: 'ჰოთ-დოგი',
    glb: 'https://pub-3c68559de18f4aee94d127e180937bdd.r2.dev/hot_dog_draco.glb',
    usdz: 'https://pub-3c68559de18f4aee94d127e180937bdd.r2.dev/hot_dog.usdz',
    poster: localAsset('/assets/models/hot_dog_poster.webp'),
    scale: 0.9312,
  },
  croissant: {
    name: 'Chocolate Croissant',
    nameKa: 'შოკოლადის კრუასანი',
    glb: 'https://pub-3c68559de18f4aee94d127e180937bdd.r2.dev/croissant_draco.glb',
    usdz: 'https://pub-3c68559de18f4aee94d127e180937bdd.r2.dev/croissant.usdz',
    poster: localAsset('/assets/models/croissant_poster.webp'),
    scale: 0.9,
  },
  mondaySteak: {
    name: 'Beef Steak',
    nameKa: 'საქონლის სტეიკი',
    glb: 'https://pub-b253d60df14c4c1f94bada002fa59596.r2.dev/monday-greens/1784567265438_steak-with-mushroom-sauce-28cm.glb',
    usdz: 'https://pub-b253d60df14c4c1f94bada002fa59596.r2.dev/monday-greens/1784567271842_steak-with-mushroom-sauce-28cm.usdz',
    poster: 'https://pub-b253d60df14c4c1f94bada002fa59596.r2.dev/monday-greens/1784797864072_IMG_4409.webp',
    scale: 1,
  },
  mondayBenedict: {
    name: 'Benedict with Bacon',
    nameKa: 'ბენედიქტი ბეკონით',
    glb: 'https://pub-b253d60df14c4c1f94bada002fa59596.r2.dev/monday-greens/1784565245600_eggs-benedict-with-ham-28cm.glb',
    usdz: 'https://pub-b253d60df14c4c1f94bada002fa59596.r2.dev/monday-greens/1784565253451_eggs-benedict-with-ham-28cm.usdz',
    poster: 'https://wolt-menu-images-cdn.wolt.com/menu-images/61f8e7d903bbc86d6fdd56c1/f3073162-c4e9-11ee-bcc0-96b5e0412694_161a2156.jpg',
    scale: 1,
  },
} as const
