export type EditionId = 'standard'

export type ProductImage = {
  src: string
  alt: string
  invert?: boolean
}

export const PRODUCT = {
  id: 'absolute-unit-17',
  name: 'BOXDRIVE',
  tagline: 'Closed-loop stepper controller for NEMA 17 motors',
  version: 'HW v3.26',
  images: [
    { src: '/doodle.png', alt: 'BOXDRIVE doodle sketch guide' },
    { src: '/real3.png', alt: 'BOXDRIVE real photo 1' },
    { src: '/real4.png', alt: 'BOXDRIVE real photo 2' },
    { src: '/real5.png', alt: 'BOXDRIVE real photo 3' },
    { src: '/img3.png', alt: 'BOXDRIVE photo 4' },
    { src: '/img4.png', alt: 'BOXDRIVE photo 5' },
    { src: '/img5.png', alt: 'BOXDRIVE photo 6' },
    { src: '/back.png', alt: 'BOXDRIVE back view' },
    { src: '/exploded.png', alt: 'BOXDRIVE exploded parts view' },
    { src: '/dimentions top.png', alt: 'Top dimensions drawing', invert: true },
    { src: '/dimention side.png', alt: 'Side dimensions drawing', invert: true },
  ] as ProductImage[],
  editions: {
    standard: {
      id: 'standard' as const,
      name: 'Standard',
      price: 3799,
    },
  },
}

export function formatInr(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

export type CartItem = {
  productId: string
  name: string
  edition: EditionId
  editionName: string
  price: number
  qty: number
  image: string
}

export function itemKey(item: Pick<CartItem, 'productId' | 'edition'>) {
  return `${item.productId}:${item.edition}`
}
