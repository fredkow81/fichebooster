export const PRODUCT_UPDATE_MUTATION = /* GraphQL */ `
  mutation ProductUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        title
        handle
        descriptionHtml
        seo {
          title
          description
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const PRODUCT_VARIANT_UPDATE_MUTATION = /* GraphQL */ `
  mutation ProductVariantUpdate($input: ProductVariantInput!) {
    productVariantUpdate(input: $input) {
      productVariant {
        id
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const ACCESS_SCOPES_QUERY = /* GraphQL */ `
  query AccessScopes {
    currentAppInstallation {
      accessScopes {
        handle
      }
    }
  }
`;
