export const PRODUCT_LIST_QUERY = /* GraphQL */ `
  query ProductList($first: Int!, $query: String, $after: String) {
    products(first: $first, query: $query, after: $after, sortKey: UPDATED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        handle
        status
        updatedAt
        featuredImage {
          id
          url
          altText
        }
        collections(first: 5) {
          nodes {
            id
            title
            handle
          }
        }
      }
    }
  }
`;

export const PRODUCT_DETAIL_QUERY = /* GraphQL */ `
  query ProductDetail($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      descriptionHtml
      vendor
      productType
      status
      updatedAt
      onlineStoreUrl
      seo {
        title
        description
      }
      images(first: 10) {
        nodes {
          id
          url
          altText
        }
      }
      variants(first: 50) {
        nodes {
          id
          title
          price
          sku
          selectedOptions {
            name
            value
          }
          image {
            id
            url
            altText
          }
        }
      }
      collections(first: 10) {
        nodes {
          id
          title
          handle
        }
      }
    }
  }
`;

export const COLLECTIONS_QUERY = /* GraphQL */ `
  query CollectionsList($first: Int!) {
    collections(first: $first) {
      nodes {
        id
        title
        handle
        productsCount {
          count
        }
      }
    }
  }
`;

export const COLLECTION_PRODUCTS_QUERY = /* GraphQL */ `
  query CollectionProducts($id: ID!, $first: Int!) {
    collection(id: $id) {
      products(first: $first) {
        nodes {
          id
          title
          handle
          status
          updatedAt
          featuredImage {
            id
            url
            altText
          }
          collections(first: 5) {
            nodes {
              id
              title
              handle
            }
          }
        }
      }
    }
  }
`;

export const SHOP_QUERY = /* GraphQL */ `
  query ShopInfo {
    shop {
      name
      myshopifyDomain
      primaryDomain {
        url
      }
    }
  }
`;
