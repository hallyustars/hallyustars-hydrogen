import {json, redirect} from '@shopify/remix-oxygen';
import {Form, useActionData} from '@remix-run/react';
import { useState } from 'react';
import { Button } from '~/components';

import {Link} from '~/components';
import {getInputStyleClasses} from '~/lib/utils';

export async function loader({context, params}) {
  const customerAccessToken = await context.session.get('customerAccessToken');

  if (customerAccessToken) {
    return redirect(params.locale ? `${params.locale}/account` : '/account');
  }

  return new Response(null);
}

const badRequest = (data) => json(data, {status: 400});

export const action = async ({request, context}) => {
  const formData = await request.formData();
  const email = formData.get('email');

  if (!email || typeof email !== 'string') {
    return badRequest({
      formError: 'Por favor, proporciona un correo electrónico.',
    });
  }

  try {
    await context.storefront.mutate(CUSTOMER_RECOVER_MUTATION, {
      variables: {email},
    });

    return json({resetRequested: true});
  } catch (error) {
    return badRequest({
      formError: 'Algo salió mal. Por favor, intenta de nuevo más tarde.',
    });
  }
};

export const meta = () => {
  return [{title: 'Recuperar Contraseña'}];
};

export default function Recover() {
  const actionData = useActionData();
  const [nativeEmailError, setNativeEmailError] = useState(null);
  const isSubmitted = actionData?.resetRequested;

  return (
    <div className="flex justify-center my-24 px-4">
      <div className="max-w-md w-full">
        {isSubmitted ? (
          <>
            <h1 className="text-4xl">Solicitud Enviada.</h1>
            <p className="mt-4">
              Si esa dirección de correo electrónico está en nuestro sistema, recibirás un correo
              con instrucciones sobre cómo restablecer tu contraseña en unos minutos.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-4xl">Olvidé mi Contraseña.</h1>
            <p className="mt-4">
              Ingresa la dirección de correo electrónico asociada con tu cuenta para recibir un
              enlace para restablecer tu contraseña.
            </p>
            {/* TODO: Add onSubmit to validate _before_ submission with native? */}
            <Form
              method="post"
              noValidate
              className="pt-6 pb-8 mt-4 mb-4 space-y-3"
            >
              {actionData?.formError && (
                <div className="flex items-center justify-center mb-6 bg-zinc-500">
                  <p className="m-4 text-s text-contrast">
                    {actionData.formError}
                  </p>
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
                  <p className="text-red-500 text-xs">
                    {nativeEmailError} &nbsp;
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Button
                  className=" block w-full"
                  type="submit"
                >
                  Solicitar enlace de restablecimiento
                </Button>
              </div>
              <div className="flex items-center mt-8 border-t border-gray-300">
                <p className="align-baseline text-sm mt-6">
                  Ir a &nbsp;
                  <Link className="inline underline" to="/account/login">
                    Iniciar Sesión
                  </Link>
                </p>
              </div>
            </Form>
          </>
        )}
      </div>
    </div>
  );
}

const CUSTOMER_RECOVER_MUTATION = `#graphql
  mutation customerRecover($email: String!) {
    customerRecover(email: $email) {
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;
