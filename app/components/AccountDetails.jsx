import {Link} from '~/components';

export function AccountDetails({customer}) {
  const {firstName, lastName, email, phone} = customer;

  return (
    <>
      <div className="grid w-full gap-4 p-4 py-6 md:gap-8 md:p-8 lg:p-12">
        <h3 className="font-bold text-lead">Detalles de la cuenta</h3>
        <div className="lg:p-8 p-6 border border-gray-200 rounded">
          <div className="flex">
            <h3 className="font-bold text-base flex-1">Perfil y seguridad</h3>
            <Link
              prefetch="intent"
              className="underline text-sm font-normal"
              to="/account/edit"
            >
              Editar
            </Link>
          </div>
          <div className="mt-4 text-sm text-primary/50">Nombre</div>
          <p className="mt-1">
            {firstName || lastName
              ? (firstName ? firstName + ' ' : '') + lastName
              : 'Agregar nombre'}{' '}
          </p>

          <div className="mt-4 text-sm text-primary/50">Contacto</div>
          <p className="mt-1">{phone ?? 'Agregar móvil'}</p>

          <div className="mt-4 text-sm text-primary/50">Dirección de correo electrónico</div>
          <p className="mt-1">{email}</p>

          <div className="mt-4 text-sm text-primary/50">Contraseña</div>
          <p className="mt-1">**************</p>
        </div>
      </div>
    </>
  );
}
