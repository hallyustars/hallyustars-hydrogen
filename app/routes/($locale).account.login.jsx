import {json, redirect} from '@shopify/remix-oxygen';
import {Form, useActionData, useLoaderData} from '@remix-run/react';
import {useState} from 'react';

import {getInputStyleClasses} from '~/lib/utils';
import {Link} from '~/components';

export const handle = {
  isPublic: true,
};

export async function loader({context, params}) {
  const customerAccessToken = await context.session.get('customerAccessToken');

  if (customerAccessToken) {
    return redirect(params.locale ? `${params.locale}/account` : '/account');
  }

  // TODO: Query for this?
  return json({shopName: 'Hydrogen'});
}

const badRequest = (data) => json(data, {status: 400});

export const action = async ({request, context, params}) => {
  const formData = await request.formData();

  const email = formData.get('email');
  const password = formData.get('password');

  if (
    !email ||
    !password ||
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    return badRequest({
      formError: 'Please provide both an email and a password.',
    });
  }

  const {session, storefront, cart} = context;

  try {
    const customerAccessToken = await doLogin(context, {email, password});
    session.set('customerAccessToken', customerAccessToken);

    // Sync customerAccessToken with existing cart
    const result = await cart.updateBuyerIdentity({customerAccessToken});

    // Update cart id in cookie
    const headers = cart.setCartId(result.cart.id);
    headers.append('Set-Cookie', await session.commit());

        return redirect(params.locale ? `/${params.locale}/account` : '/account', {
          headers,
        });
      } catch (error) {
        if (storefront.isApiError(error)) {
          return badRequest({
            formError: 'Algo salió mal. Por favor, inténtalo de nuevo más tarde.',
          });
        }

        /**
         * El usuario hizo algo mal, pero el error crudo del API no es muy amigable.
         * Vamos a inventar uno.
         */
        return badRequest({
          formError:
            'Lo siento. No reconocimos tu correo electrónico o contraseña. Por favor, intenta iniciar sesión de nuevo o crea una nueva cuenta.',
        });
      }
    };

    export const meta = () => {
      return [{title: 'Iniciar sesión'}];
    };

    export default function Login() {
      const {shopName} = useLoaderData();
      const actionData = useActionData();
      const [nativeEmailError, setNativeEmailError] = useState(null);
      const [nativePasswordError, setNativePasswordError] = useState(null);

      return (
        <div className="flex justify-center my-24 px-4">
          <div className="max-w-md w-full">
            <h1 className="text-4xl">Iniciar sesión.</h1>
            {/* TODO: Agregar onSubmit para validar _antes_ del envío con native? */}
            <Form
              method="post"
              noValidate
              className="pt-6 pb-8 mt-4 mb-4 space-y-3"
            >
              {actionData?.formError && (
                <div className="flex items-center justify-center mb-6 bg-zinc-500">
                  <p className="m-4 text-s text-contrast">{actionData.formError}</p>
                </div>
              )}
              <div>
                <input
                  className={`mb-1 ${getInputStyleClasses(nativeEmailError)}`}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Dirección de correo electrónico"
                  aria-label="Dirección de correo electrónico"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  onBlur={(event) => {
                    setNativeEmailError(
                      event.currentTarget.value.length &&
                        !event.currentTarget.validity.valid
                        ? 'Dirección de correo electrónico inválida'
                        : null,
                    );
                  }}
                />
                {nativeEmailError && (
                  <p className="text-red-500 text-xs">{nativeEmailError} &nbsp;</p>
                )}
              </div>

              <div>
                <input
                  className={`mb-1 ${getInputStyleClasses(nativePasswordError)}`}
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Contraseña"
                  aria-label="Contraseña"
                  minLength={8}
                  required
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  onBlur={(event) => {
                    if (
                      event.currentTarget.validity.valid ||
                      !event.currentTarget.value.length
                    ) {
                      setNativePasswordError(null);
                    } else {
                      setNativePasswordError(
                        event.currentTarget.validity.valueMissing
                          ? 'Por favor, ingresa una contraseña'
                          : 'Las contraseñas deben tener al menos 8 caracteres',
                      );
                    }
                  }}
                />
                {nativePasswordError && (
                  <p className="text-red-500 text-xs">
                    {' '}
                    {nativePasswordError} &nbsp;
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <button
                  className="bg-primary text-contrast rounded py-2 px-4 focus:shadow-outline block w-full"
                  type="submit"
                  disabled={!!(nativePasswordError || nativeEmailError)}
                >
                  Iniciar sesión
                </button>
              </div>
              <div className="flex justify-between items-center mt-8 border-t border-gray-300">
                <p className="align-baseline text-sm mt-6">
                  ¿Eres nuevo en {shopName}? &nbsp;
                  <Link className="inline underline" to="/account/register">
                    Crea una cuenta
                  </Link>
                </p>
                <Link
                  className="mt-6 inline-block align-baseline text-sm text-primary/50"
                  to="/account/recover"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </Form>
          </div>
        </div>
      );
    }

    const LOGIN_MUTATION = `#graphql
      mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
        customerAccessTokenCreate(input: $input) {
          customerUserErrors {
            code
            field
            message
          }
          customerAccessToken {
            accessToken
            expiresAt
          }
        }
      }
    `;

    export async function doLogin({storefront}, {email, password}) {
      const data = await storefront.mutate(LOGIN_MUTATION, {
        variables: {
          input: {
            email,
            password,
          },
        },
      });

      if (data?.customerAccessTokenCreate?.customerAccessToken?.accessToken) {
        return data.customerAccessTokenCreate.customerAccessToken.accessToken;
      }

      /**
       * Algo está mal con la entrada del usuario.
       */
      throw new Error(
        data?.customerAccessTokenCreate?.customerUserErrors.join(', '),
      );
    }
