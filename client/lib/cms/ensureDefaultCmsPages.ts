import CmsPage from "@/models/CmsPage";

import {
  DEFAULT_CMS_PAGES,
} from "@/lib/cms/defaultCmsPages";

/*
|--------------------------------------------------------------------------
| ENSURE DEFAULT CMS PAGES
|--------------------------------------------------------------------------
|
| $setOnInsert intentionally વાપર્યું છે.
|
| એટલે:
|
| - Missing page હોય તો create થશે.
| - Existing page હોય તો touch નહીં થાય.
| - Adminમાંથી બદલેલી policy overwrite નહીં થાય.
|
|--------------------------------------------------------------------------
*/

export async function ensureDefaultCmsPages() {
  if (!DEFAULT_CMS_PAGES.length) {
    return;
  }

  const operations =
    DEFAULT_CMS_PAGES.map(
      (page) => ({
        updateOne: {
          filter: {
            slug: page.slug,
          },

          update: {
            $setOnInsert: page,
          },

          upsert: true,
        },
      })
    );

  await CmsPage.bulkWrite(
    operations,
    {
      ordered: false,
    }
  );
}

export default ensureDefaultCmsPages;