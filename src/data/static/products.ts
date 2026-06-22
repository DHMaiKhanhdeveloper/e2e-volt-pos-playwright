export interface Product {
  /** Real DB id (GraphQL `serviceList.id`, where `type = "product"`). */
  id: string;
  name: string;
  /** Display price, pre-tax (e.g. "$9.00"). */
  price: string;
  /** Raw price in cents as stored in the DB. */
  priceCents: number;
  /** Owning category id (the "Product" category, `category.type = "product"`). */
  categoryId: string;
}

/**
 * "Product" category id in the Volt POS dev DB
 * (`query { categoryList { id name type } }` → name "Product", type "product").
 * Retail products are filed under the order's "Store" bucket and are NOT
 * attributed to a staff member (unlike services), so they alone do not make a
 * tip collectible.
 */
export const PRODUCT_CATEGORY_ID = '019dbed4-ca0c-79b9-ab3c-aa3ae20a4a66';

/**
 * Retail products available in the Volt POS dev environment.
 *
 * Values are sourced from the live GraphQL DB
 * (`query { serviceList { id name price type status categoryId } }`,
 * `type = "product"` AND `status = "active"`) — NOT hand-typed. Re-run that
 * query and update here if the seed catalogue changes. Prices are stored in
 * cents; `price` is the pre-tax display string.
 */
export const PRODUCTS = {
  ACETONE: {
    id: '019dbed4-ce24-76a9-bb07-b48e95f4e527',
    name: 'Acetone',
    price: '$9.00',
    priceCents: 900,
    categoryId: PRODUCT_CATEGORY_ID,
  },
  HAND_CREAM: {
    id: '019dbed4-ce1d-7e5a-81e7-75de227ecdbe',
    name: 'Hand Cream',
    price: '$29.99',
    priceCents: 2999,
    categoryId: PRODUCT_CATEGORY_ID,
  },
  NAIL_CLIPPER: {
    id: '019dbed4-ce25-73c3-86eb-8db1a3563c31',
    name: 'Nail Clipper',
    price: '$8.00',
    priceCents: 800,
    categoryId: PRODUCT_CATEGORY_ID,
  },
  CUTICLE_PUSHER: {
    id: '019dbed4-ce20-7ba3-a213-580292931b7c',
    name: 'Cuticle Pusher',
    price: '$123.00',
    priceCents: 12300,
    categoryId: PRODUCT_CATEGORY_ID,
  },
  NIPPER: {
    id: '019dbed4-ce21-7bea-bc0f-0bdb231bb78e',
    name: 'Nipper',
    price: '$23.00',
    priceCents: 2300,
    categoryId: PRODUCT_CATEGORY_ID,
  },
  UV_LED_LAMP: {
    id: '019dbed4-ce23-7a3f-994e-a9a545c984c6',
    name: 'UV/LED Lamp',
    price: '$20.00',
    priceCents: 2000,
    categoryId: PRODUCT_CATEGORY_ID,
  },
  HARDENER: {
    id: '019dbed4-ce1e-79d6-90da-fed593e96a37',
    name: 'Hardener',
    price: '$100.00',
    priceCents: 10000,
    categoryId: PRODUCT_CATEGORY_ID,
  },
  BUFFER_FILE: {
    id: '019dbed4-ce27-797d-a53c-cdd1c2a58dad',
    name: 'Buffer/Filee',
    price: '$25.00',
    priceCents: 2500,
    categoryId: PRODUCT_CATEGORY_ID,
  },
  POLISH_REMOVER: {
    id: '019dbed4-ce29-7312-8007-7c2ffb356b49',
    name: 'Polish Remover',
    price: '$10.00',
    priceCents: 1000,
    categoryId: PRODUCT_CATEGORY_ID,
  },
  SALT_SCRUB: {
    id: '019dbed4-cdee-7c89-806f-534ca1bfb24c',
    name: 'Salt Scrub',
    price: '$10.00',
    priceCents: 1000,
    categoryId: PRODUCT_CATEGORY_ID,
  },
  SUGAR_SCRUB: {
    id: '019dbed4-cdfc-706a-ab9d-82e78f845431',
    name: 'Sugar Scrub',
    price: '$10.00',
    priceCents: 1000,
    categoryId: PRODUCT_CATEGORY_ID,
  },
} as const satisfies Record<string, Product>;
