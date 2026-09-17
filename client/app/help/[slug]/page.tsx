import PublicCmsPage from "@/components/cms/PublicCmsPage";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type HelpPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

/*
|--------------------------------------------------------------------------
| HELP PAGE
|--------------------------------------------------------------------------
*/

export default async function HelpPage({
  params,
}: HelpPageProps) {
  const {
    slug,
  } = await params;

  return (
    <PublicCmsPage
      slug={slug}
      expectedSection="help"
    />
  );
}