export interface ShopifyImage {
  id: string;
  url: string;
  altText: string | null;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
  sku: string | null;
  selectedOptions: { name: string; value: string }[];
  image: ShopifyImage | null;
}

export interface ShopifyCollectionRef {
  id: string;
  title: string;
  handle: string;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  status: string;
  seo: { title: string | null; description: string | null };
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  collections: ShopifyCollectionRef[];
  onlineStoreUrl: string | null;
  updatedAt: string;
}

export interface ShopifyProductSummary {
  id: string;
  title: string;
  handle: string;
  status: string;
  featuredImage: ShopifyImage | null;
  collections: ShopifyCollectionRef[];
  updatedAt: string;
}

export interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  productsCount: number;
}

export interface ProductUpdatePayload {
  title?: string;
  handle?: string;
  descriptionHtml?: string;
  seo?: { title?: string; description?: string };
  variants?: { id: string; title: string }[];
}
