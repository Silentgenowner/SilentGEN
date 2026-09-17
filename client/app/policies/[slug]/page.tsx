import PublicCmsPage from "@/components/cms/PublicCmsPage";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type PolicyPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

/*
|--------------------------------------------------------------------------
| POLICY PAGE
|--------------------------------------------------------------------------
*/

export default async function PolicyPage({
  params,
}: PolicyPageProps) {
  const {
    slug,
  } = await params;

  return (
    <PublicCmsPage
      slug={slug}
      expectedSection="policy"
    />
  );
}