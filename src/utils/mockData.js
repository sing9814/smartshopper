const timestampFromIso = (isoString) => {
  const date = new Date(isoString);

  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: date.getMilliseconds() * 1e6,
  };
};

const makeCategory = (category, subCategory) => ({
  category,
  subCategory: {
    id: `${category.toLowerCase().replace(/\s+/g, '_')}_${subCategory
      .toLowerCase()
      .replace(/\s+/g, '_')}`,
    name: subCategory,
    custom: false,
  },
});

const makeWears = (dates) => dates.map((date) => timestampFromIso(`${date}T18:00:00.000Z`));

const formatDateKey = (date) => date.toISOString().split('T')[0];

const makeWearDates = (count, startDate, intervalDays = 5) => {
  const start = new Date(`${startDate}T12:00:00.000Z`);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index * intervalDays);
    return formatDateKey(date);
  });
};

const makePurchase = ({
  key,
  name,
  category,
  subCategory,
  note,
  paidPrice,
  regularPrice = null,
  datePurchased,
  dateCreated,
  wearDates,
}) => ({
  key,
  name,
  category: makeCategory(category, subCategory),
  note,
  wears: makeWears(wearDates),
  regularPrice,
  paidPrice,
  datePurchased,
  dateCreated: timestampFromIso(`${dateCreated}T14:30:00.000Z`),
});

export const USE_FAKE_DATA = false;

export const mockUserData = {
  email: 'demo@smartshopper.app',
  isGuest: false,
  onboarded: true,
  upgradedAt: null,
};

export const mockCustomCategories = [
  {
    id: 'mock-custom-activewear',
    name: 'Activewear',
  },
  {
    id: 'mock-custom-loungewear',
    name: 'Loungewear',
  },
  {
    id: 'mock-custom-occasionwear',
    name: 'Occasionwear',
  },
];

export const createMockCategories = (categories) => [
  ...categories.map((category) => ({
    name: category.name,
    subCategories: category.subCategories.map((subCategory) => ({
      id: `${category.name.toLowerCase().replace(/\s+/g, '_')}_${subCategory
        .toLowerCase()
        .replace(/\s+/g, '_')}`,
      name: subCategory,
      custom: false,
    })),
  })),
  ...mockCustomCategories.map((category) => ({
    id: category.id,
    name: category.name,
    custom: true,
    subCategories: [],
  })),
];

export const mockCollections = [
  {
    id: 'mock-work-capsule',
    name: 'Work outfit',
    description: 'Easy weekday pieces',
    items: ['mock-black-trousers', 'mock-cream-cardigan', 'mock-loafers'],
    dateCreated: timestampFromIso('2026-03-02T11:00:00.000Z'),
  },
  {
    id: 'mock-weekend',
    name: 'Weekend',
    description: 'Comfortable repeat favorites',
    items: ['mock-white-sneakers', 'mock-graphic-tee', 'mock-denim-jacket'],
    dateCreated: timestampFromIso('2026-04-05T11:00:00.000Z'),
  },
  {
    id: 'mock-wear-levels',
    name: 'Wear progress samples',
    description: 'Items covering every wear bucket',
    items: [
      'mock-silk-scarf',
      'mock-rain-jacket',
      'mock-black-trousers',
      'mock-striped-turtleneck',
      'mock-classic-blazer',
      'mock-gold-watch',
      'mock-white-sneakers',
    ],
    dateCreated: timestampFromIso('2026-05-01T11:00:00.000Z'),
  },
];

export const mockPurchases = [
  makePurchase({
    key: 'mock-black-trousers',
    name: 'Black tailored trousers',
    category: 'Bottoms',
    subCategory: 'Pants',
    note: 'Workhorse pair for office days.',
    paidPrice: 6800,
    regularPrice: 9800,
    datePurchased: '2026-01-08',
    dateCreated: '2026-01-08',
    wearDates: makeWearDates(10, '2026-02-06', 12),
  }),
  makePurchase({
    key: 'mock-cream-cardigan',
    name: 'Cream cardigan',
    category: 'Tops',
    subCategory: 'Cardigan',
    note: 'Soft layering piece.',
    paidPrice: 4200,
    datePurchased: '2026-02-12',
    dateCreated: '2026-02-12',
    wearDates: ['2026-03-28', '2026-04-12', '2026-04-26', '2026-05-11', '2026-05-25'],
  }),
  makePurchase({
    key: 'mock-white-sneakers',
    name: 'White leather sneakers',
    category: 'Footwear',
    subCategory: 'Sneakers',
    note: 'Casual default shoes.',
    paidPrice: 7500,
    regularPrice: 11000,
    datePurchased: '2025-09-01',
    dateCreated: '2025-09-01',
    wearDates: makeWearDates(82, '2025-09-25', 3),
  }),
  makePurchase({
    key: 'mock-denim-jacket',
    name: 'Denim jacket',
    category: 'Outerwear',
    subCategory: 'Denim jacket',
    note: 'Good with dresses and tees.',
    paidPrice: 5400,
    datePurchased: '2026-03-01',
    dateCreated: '2026-03-01',
    wearDates: makeWearDates(4, '2026-04-10', 15),
  }),
  makePurchase({
    key: 'mock-midi-dress',
    name: 'Green midi dress',
    category: 'One piece',
    subCategory: 'Midi dress',
    note: 'Bought for spring events.',
    paidPrice: 8900,
    regularPrice: 12000,
    datePurchased: '2026-03-18',
    dateCreated: '2026-03-18',
    wearDates: makeWearDates(2, '2026-04-20', 35),
  }),
  makePurchase({
    key: 'mock-loafers',
    name: 'Brown loafers',
    category: 'Footwear',
    subCategory: 'Loafers',
    note: 'Comfortable enough for long days.',
    paidPrice: 6400,
    datePurchased: '2026-02-27',
    dateCreated: '2026-02-27',
    wearDates: makeWearDates(5, '2026-03-15', 18),
  }),
  makePurchase({
    key: 'mock-graphic-tee',
    name: 'Vintage graphic tee',
    category: 'Tops',
    subCategory: 'Graphic tee',
    note: 'Weekend favorite.',
    paidPrice: 1800,
    datePurchased: '2026-04-03',
    dateCreated: '2026-04-03',
    wearDates: makeWearDates(3, '2026-04-26', 15),
  }),
  makePurchase({
    key: 'mock-rain-jacket',
    name: 'Navy rain jacket',
    category: 'Outerwear',
    subCategory: 'Rain jacket',
    note: 'Useful, but only when the weather asks.',
    paidPrice: 5900,
    regularPrice: 7900,
    datePurchased: '2026-02-02',
    dateCreated: '2026-02-02',
    wearDates: makeWearDates(1, '2026-05-21'),
  }),
  makePurchase({
    key: 'mock-watch',
    name: 'Gold watch',
    category: 'Accessories',
    subCategory: 'Watch',
    note: 'Daily accessory candidate.',
    paidPrice: 3200,
    datePurchased: '2025-11-05',
    dateCreated: '2025-11-05',
    wearDates: makeWearDates(60, '2025-11-30', 3),
  }),
  makePurchase({
    key: 'mock-striped-turtleneck',
    name: 'Striped turtleneck',
    category: 'Tops',
    subCategory: 'Turtleneck',
    note: 'Reliable cold-weather rotation piece.',
    paidPrice: 3600,
    regularPrice: 5200,
    datePurchased: '2025-12-01',
    dateCreated: '2025-12-01',
    wearDates: makeWearDates(22, '2025-12-30', 7),
  }),
  makePurchase({
    key: 'mock-classic-blazer',
    name: 'Classic black blazer',
    category: 'Outerwear',
    subCategory: 'Blazer',
    note: 'The interview, dinner, and emergency polish layer.',
    paidPrice: 9200,
    regularPrice: 14500,
    datePurchased: '2025-10-10',
    dateCreated: '2025-10-10',
    wearDates: makeWearDates(40, '2025-11-12', 5),
  }),
  makePurchase({
    key: 'mock-silk-scarf',
    name: 'Printed silk scarf',
    category: 'Accessories',
    subCategory: 'Scarf',
    note: 'Still figuring out how to style it.',
    paidPrice: 2600,
    datePurchased: '2026-04-25',
    dateCreated: '2026-04-25',
    wearDates: [],
  }),
  makePurchase({
    key: 'mock-yoga-set',
    name: 'Sage yoga set',
    category: 'Activewear',
    subCategory: 'Activewear',
    note: 'Custom category example.',
    paidPrice: 5800,
    regularPrice: 7600,
    datePurchased: '2026-05-04',
    dateCreated: '2026-05-04',
    wearDates: makeWearDates(6, '2026-05-08', 4),
  }),
  makePurchase({
    key: 'mock-lounge-set',
    name: 'Ribbed lounge set',
    category: 'Loungewear',
    subCategory: 'Loungewear',
    note: 'For quiet days at home.',
    paidPrice: 4700,
    datePurchased: '2026-04-18',
    dateCreated: '2026-04-18',
    wearDates: makeWearDates(9, '2026-04-20', 5),
  }),
];
