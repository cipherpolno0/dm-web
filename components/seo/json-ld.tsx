type JsonLdProps = Readonly<{
  data: Record<string, unknown>;
}>;

/** Renders structured data without allowing content to close the script tag. */
export function JsonLd({ data }: JsonLdProps) {
  const serialized = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script dangerouslySetInnerHTML={{ __html: serialized }} type="application/ld+json" />;
}
