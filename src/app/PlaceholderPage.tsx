interface PlaceholderPageProps {
  title: string;
}

/** Temporary page body; replaced by real screens in later prompts. */
export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
    </section>
  );
}
