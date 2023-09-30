import {Button} from './Button';
import {FeaturedSection} from './FeaturedSection';
import {PageHeader, Text} from './Text';

export function NotFound({type = 'page'}) {
  const heading = `Hemos perdido ${type === 'page' ? 'esta' : 'este'} ${type}`;
  const description = `No pudimos encontrar la ${type} que estás buscando. Intenta revisar la URL o volver a la página de inicio.`;

  return (
    <>
      <PageHeader heading={heading}>
        <Text width="narrow" as="p">
          {description}
        </Text>
        <Button width="auto" variant="secondary" to={'/'}>
          Llévame a la página de inicio
        </Button>
      </PageHeader>
      <FeaturedSection />
    </>
  );
}
