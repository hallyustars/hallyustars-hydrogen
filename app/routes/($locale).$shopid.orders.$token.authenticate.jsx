import {redirect} from '@shopify/remix-oxygen';
import invariant from 'tiny-invariant';

import {Button, PageHeader} from '~/components';

/*
 Si tu tienda en línea tenía pedidos activos antes de lanzar tu tienda Hydrogen,
 y la tienda Hydrogen utiliza el mismo dominio que antes usaba la tienda en línea,
 entonces los clientes recibirán páginas 404 cuando hagan clic en las antiguas URL de estado de pedido
 que se están redirigiendo a tu tienda Hydrogen. Para evitar esto, asegúrate de redirigir
 esas solicitudes de vuelta a Shopify.
*/
export async function loader({request, context: {storefront}}) {
  const {origin} = new URL(request.url);
  const {shop} = await storefront.query(
    `#graphql
      query getShopPrimaryDomain { shop { primaryDomain { url } } }
    `,
    {cache: storefront.CacheLong()},
  );
  invariant(shop, 'Error al redirigir a la URL de estado del pedido');
  return redirect(request.url.replace(origin, shop.primaryDomain.url));
}

export default function () {
  return null;
}
export function ErrorBoundary() {
  return (
    <PageHeader
      heading={'Error al redirigir a la URL de estado del pedido'}
      className="text-red-600"
    >
      <div className="flex items-baseline justify-between w-full">
        <Button as="button" onClick={() => window.location.reload()}>
          Intentar de nuevo
        </Button>
      </div>
    </PageHeader>
  );
}
