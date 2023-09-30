import {json, redirect} from '@shopify/remix-oxygen';
import {
  Form,
  useActionData,
  useOutletContext,
  useParams,
  useNavigation,
} from '@remix-run/react';
import {flattenConnection} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';

import {Button, Text} from '~/components';
import {assertApiErrors, getInputStyleClasses} from '~/lib/utils';

const badRequest = (data) => json(data, {status: 400});

export const handle = {
  renderInModal: true,
};

export const action = async ({request, context, params}) => {
  const {storefront, session} = context;
  const formData = await request.formData();

  const customerAccessToken = await session.get('customerAccessToken');
  invariant(customerAccessToken, 'Debes estar registrado para editar tu cuenta.');

  const addressId = formData.get('addressId');
  invariant(typeof addressId === 'string', 'Debes proporcionar un ID de dirección.');

  if (request.method === 'DELETE') {
    try {
      const data = await storefront.mutate(DELETE_ADDRESS_MUTATION, {
        variables: {customerAccessToken, id: addressId},
      });

      assertApiErrors(data.customerAddressDelete);

      return redirect(params.locale ? `${params.locale}/account` : '/account');
    } catch (error) {
      return badRequest({formError: error.message});
    }
  }

  const address = {};

  const keys = [
    'lastName',
    'firstName',
    'address1',
    'address2',
    'city',
    'province',
    'country',
    'zip',
    'phone',
    'company',
  ];

  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === 'string') {
      address[key] = value;
    }
  }

  const defaultAddress = formData.get('defaultAddress');

  if (addressId === 'add') {
    try {
      const data = await storefront.mutate(CREATE_ADDRESS_MUTATION, {
        variables: {customerAccessToken, address},
      });

      assertApiErrors(data.customerAddressCreate);

      const newId = data.customerAddressCreate?.customerAddress?.id;
      invariant(newId, 'Se esperaba que se creara la dirección del cliente');

      if (defaultAddress) {
        const data = await storefront.mutate(UPDATE_DEFAULT_ADDRESS_MUTATION, {
          variables: {customerAccessToken, addressId: newId},
        });

        assertApiErrors(data.customerDefaultAddressUpdate);
      }

      return redirect(params.locale ? `${params.locale}/account` : '/account');
    } catch (error) {
      return badRequest({formError: error.message});
    }
  } else {
    try {
      const data = await storefront.mutate(UPDATE_ADDRESS_MUTATION, {
        variables: {
          address,
          customerAccessToken,
          id: decodeURIComponent(addressId),
        },
      });

      assertApiErrors(data.customerAddressUpdate);

      if (defaultAddress) {
        const data = await storefront.mutate(UPDATE_DEFAULT_ADDRESS_MUTATION, {
          variables: {
            customerAccessToken,
            addressId: decodeURIComponent(addressId),
          },
        });

        assertApiErrors(data.customerDefaultAddressUpdate);
      }

      return redirect(params.locale ? `${params.locale}/account` : '/account');
    } catch (error) {
      return badRequest({formError: error.message});
    }
  }
};

export default function EditAddress() {
  const {id: addressId} = useParams();
  const isNewAddress = addressId === 'add';
  const actionData = useActionData();
  const {state} = useNavigation();
  const {customer} = useOutletContext();
  const addresses = flattenConnection(customer.addresses);
  const defaultAddress = customer.defaultAddress;
  /**
   * When a refresh happens (or a user visits this link directly), the URL
   * is actually stale because it contains a special token. This means the data
   * loaded by the parent and passed to the outlet contains a newer, fresher token,
   * and we don't find a match. We update the `find` logic to just perform a match
   * on the first (permanent) part of the ID.
   */
  const normalizedAddress = decodeURIComponent(addressId ?? '').split('?')[0];
  const address = addresses.find((address) =>
    address.id.startsWith(normalizedAddress),
  );

  return (
    <>
      <Text className="mt-4 mb-6" as="h3" size="lead">
        {isNewAddress ? 'Agregar dirección' : 'Editar dirección'}
      </Text>
      <div className="max-w-lg">
        <Form method="post">
          <input
            type="hidden"
            name="addressId"
            value={address?.id ?? addressId}
          />
          {actionData?.formError && (
            <div className="flex items-center justify-center mb-6 bg-red-100 rounded">
              <p className="m-4 text-sm text-red-900">{actionData.formError}</p>
            </div>
          )}
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="firstName"
              name="firstName"
              required
              type="text"
              autoComplete="given-name"
              placeholder="Nombre"
              aria-label="Nombre"
              defaultValue={address?.firstName ?? ''}
            />
          </div>
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="lastName"
              name="lastName"
              required
              type="text"
              autoComplete="family-name"
              placeholder="Apellido"
              aria-label="Apellido"
              defaultValue={address?.lastName ?? ''}
            />
          </div>
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="company"
              name="company"
              type="text"
              autoComplete="organization"
              placeholder="Empresa"
              aria-label="Empresa"
              defaultValue={address?.company ?? ''}
            />
          </div>
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="address1"
              name="address1"
              type="text"
              autoComplete="address-line1"
              placeholder="Dirección línea 1*"
              required
              aria-label="Dirección línea 1"
              defaultValue={address?.address1 ?? ''}
            />
          </div>
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="address2"
              name="address2"
              type="text"
              autoComplete="address-line2"
              placeholder="Dirección línea 2"
              aria-label="Dirección línea 2"
              defaultValue={address?.address2 ?? ''}
            />
          </div>
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="city"
              name="city"
              type="text"
              required
              autoComplete="address-level2"
              placeholder="Ciudad"
              aria-label="Ciudad"
              defaultValue={address?.city ?? ''}
            />
          </div>
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="province"
              name="province"
              type="text"
              autoComplete="address-level1"
              placeholder="Provincia"
              required
              aria-label="Provincia"
              defaultValue={address?.province ?? ''}
            />
          </div>
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="zip"
              name="zip"
              type="text"
              autoComplete="postal-code"
              placeholder="Código Postal"
              required
              aria-label="Código Postal"
              defaultValue={address?.zip ?? ''}
            />
          </div>
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="country"
              name="country"
              type="text"
              autoComplete="country-name"
              placeholder="País"
              required
              aria-label="País"
              defaultValue={address?.country ?? ''}
            />
          </div>
          <div className="mt-3">
            <input
              className={getInputStyleClasses()}
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="Teléfono"
              aria-label="Teléfono"
              defaultValue={address?.phone ?? ''}
            />
          </div>
          <div className="mt-4">
            <input
              type="checkbox"
              name="defaultAddress"
              id="defaultAddress"
              defaultChecked={defaultAddress?.id === address?.id}
              className="border-gray-500 rounded-sm cursor-pointer border-1"
            />
            <label
              className="inline-block ml-2 text-sm cursor-pointer"
              htmlFor="defaultAddress"
            >
              Establecer como dirección predeterminada
            </label>
          </div>
          <div className="mt-8">
            <Button
              className="w-full rounded focus:shadow-outline"
              type="submit"
              variant="primary"
              disabled={state !== 'idle'}
            >
              {state !== 'idle' ? 'Guardando' : 'Guardar'}
            </Button>
          </div>
          <div>
            <Button
              to=".."
              className="w-full mt-2 rounded focus:shadow-outline"
              variant="secondary"
            >
              Cancelar
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
}

const UPDATE_ADDRESS_MUTATION = `#graphql
  mutation customerAddressUpdate(
    $address: MailingAddressInput!
    $customerAccessToken: String!
    $id: ID!
  ) {
    customerAddressUpdate(
      address: $address
      customerAccessToken: $customerAccessToken
      id: $id
    ) {
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

const DELETE_ADDRESS_MUTATION = `#graphql
  mutation customerAddressDelete($customerAccessToken: String!, $id: ID!) {
    customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
      customerUserErrors {
        code
        field
        message
      }
      deletedCustomerAddressId
    }
  }
`;

const UPDATE_DEFAULT_ADDRESS_MUTATION = `#graphql
  mutation customerDefaultAddressUpdate(
    $addressId: ID!
    $customerAccessToken: String!
  ) {
    customerDefaultAddressUpdate(
      addressId: $addressId
      customerAccessToken: $customerAccessToken
    ) {
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

const CREATE_ADDRESS_MUTATION = `#graphql
  mutation customerAddressCreate(
    $address: MailingAddressInput!
    $customerAccessToken: String!
  ) {
    customerAddressCreate(
      address: $address
      customerAccessToken: $customerAccessToken
    ) {
      customerAddress {
        id
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;
