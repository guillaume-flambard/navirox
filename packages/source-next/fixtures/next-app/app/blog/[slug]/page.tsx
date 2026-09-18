export default function Post({ params }: { params: { slug: string } }): JSX.Element {
  return <h1>{params.slug}</h1>
}
