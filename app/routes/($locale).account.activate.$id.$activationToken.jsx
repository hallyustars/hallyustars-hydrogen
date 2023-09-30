import {json, redirect} from '@shopify/remix-oxygen';
import {Form, useActionData} from '@remix-run/react';
import {useRef, useState} from 'react';

import {getInputStyleClasses} from '~/lib/utils';

const badRequest = (data) => json(data, {status: 400});

export const handle = {
  isPublic: true,
};

export const action = async ({
  request,
  context,
  params: {locale, id, activationToken},
}) => {
  if (
    !id ||
    !activationToken ||
    typeof id !== 'string' ||
    typeof activationToken !== 'string'
  ) {
    return badRequest({
      formError: 'Wrong token. The link you followed might be wrong.',
    });
  }

  const formData = await request.formData();

  const password = formData.get('password');
  const passwordConfirm = formData.get('passwordConfirm');

  if (
    !password ||
    !passwordConfirm ||
    typeof password !== 'string' ||
    typeof passwordConfirm !== 'string' ||
    password !== passwordConfirm
  ) {
    return badRequest({
      formError: 'Please provide matching passwords',
    });
  }

  const {session, storefront} = context;

  try {
    const data = await storefront.mutate(CUSTOMER_ACTIVATE_MUTATION, {
      variables: {
        id: `gid://shopify/Customer/${id}`,
        input: {
          password,
          activationToken,
        },
      },
    });

    const {accessToken} = data?.customerActivate?.customerAccessToken ?? {};
    if (!accessToken) {
          /**
           * Algo está mal con la entrada del usuario.
           */
          throw new Error(data?.customerActivate?.customerUserErrors.join(', '));
        }

        session.set('customerAccessToken', accessToken);

        return redirect(locale ? `${locale}/cuenta` : '/cuenta', {
          headers: {
            'Set-Cookie': await session.commit(),
          },
        });
      } catch (error) {
        if (storefront.isApiError(error)) {
          return badRequest({
            formError: 'Algo salió mal. Por favor, inténtelo de nuevo más tarde.',
          });
        }

        /**
         * El usuario hizo algo mal, pero el error crudo del API no es muy amigable.
         * Vamos a inventar uno.
         */
        return badRequest({
          formError: 'Lo siento. No pudimos activar su cuenta.',
        });
      }
    };

    export const meta = () => {
      return [{title: 'Activar Cuenta'}];
    };

    export default function Activate() {
      const actionData = useActionData();
      const [nativePasswordError, setNativePasswordError] = useState(null);
      const [nativePasswordConfirmError, setNativePasswordConfirmError] =
        useState(null);

      const passwordInput = useRef(null);
      const passwordConfirmInput = useRef(null);

      const validatePasswordConfirm = () => {
        if (!passwordConfirmInput.current) return;

        if (
          passwordConfirmInput.current.value.length &&
          passwordConfirmInput.current.value !== passwordInput.current?.value
        ) {
          setNativePasswordConfirmError('Las dos contraseñas ingresadas no coinciden.');
        } else if (
          passwordConfirmInput.current.validity.valid ||
          !passwordConfirmInput.current.value.length
        ) {
          setNativePasswordConfirmError(null);
        } else {
          setNativePasswordConfirmError(
            passwordConfirmInput.current.validity.valueMissing
              ? 'Por favor, vuelva a ingresar la contraseña'
              : 'Las contraseñas deben tener al menos 8 caracteres',
          );
        }
      };

      return (
        <div className="flex justify-center my-24 px-4">
          <div className="max-w-md w-full">
            <h1 className="text-4xl">Activar Cuenta.</h1>
            <p className="mt-4">Cree su contraseña para activar su cuenta.</p>
            {/* TODO: Add onSubmit to validate _before_ submission with native? */}
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
              <div className="mb-3">
                <input
                  ref={passwordInput}
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
                      validatePasswordConfirm();
                    } else {
                      setNativePasswordError(
                        event.currentTarget.validity.valueMissing
                          ? 'Por favor, ingrese una contraseña'
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
              <div className="mb-3">
                <input
                  ref={passwordConfirmInput}
                  className={`mb-1 ${getInputStyleClasses(
                    nativePasswordConfirmError,
                  )}`}
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Vuelva a ingresar la contraseña"
                  aria-label="Vuelva a ingresar la contraseña"
                  minLength={8}
                  required
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  onBlur={validatePasswordConfirm}
                />
                {nativePasswordConfirmError && (
                  <p className="text-red-500 text-xs">
                    {' '}
                    {nativePasswordConfirmError} &nbsp;
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <button
                  className="bg-primary text-contrast rounded py-2 px-4 focus:shadow-outline block w-full"
                  type="submit"
                >
                  Guardar
                </button>
              </div>
            </Form>
          </div>
        </div>
      );
    }

    const CUSTOMER_ACTIVATE_MUTATION = `#graphql
      mutation customerActivate($id: ID!, $input: CustomerActivateInput!) {
        customerActivate(id: $id, input: $input) {
          customerAccessToken {
            accessToken
            expiresAt
          }
          customerUserErrors {
            code
            field
            message
          }
        }
      }
    `;
