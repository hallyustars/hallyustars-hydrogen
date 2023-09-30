export async function loader() {
  throw new Response('No encontrado', {status: 404});
}

export default function Component() {
  return null;
}
