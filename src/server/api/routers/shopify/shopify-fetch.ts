import { Variables } from "./variables";
import { env } from '~/env'

export async function shopifyFetch({ query, variables }: {
    query: string,
    variables?: Variables
    
}) {
  const endpoint = env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const key = env.SHOPIFY_STOREFRONT_API_PRIVATE_ACCESS_TOKEN;

  console.log(endpoint)

  try {
    const result = await fetch(`https://${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': key
      },
      body: JSON.stringify( variables ? { query, variables } : { query })
    });


    console.log(await result.text())
    return {
      status: result.status,
      body: await result.json()
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      status: 500,
      error: 'Error receiving data'
    };
  }
}