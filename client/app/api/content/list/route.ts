import {
  NextRequest,
  NextResponse,
} from "next/server";

import connectDB from "@/lib/connectDB";

import CmsPage from "@/models/CmsPage";

import ensureDefaultCmsPages from "@/lib/cms/ensureDefaultCmsPages";

/*
|--------------------------------------------------------------------------
| CMS SECTION TYPE
|--------------------------------------------------------------------------
*/

type CmsSection =
  | "help"
  | "policy";

/*
|--------------------------------------------------------------------------
| GET CMS PAGE LIST
|--------------------------------------------------------------------------
|
| Examples:
|
| /api/content/list
|
| /api/content/list?section=help
|
| /api/content/list?section=policy
|
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | CONNECT DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | ENSURE DEFAULT CMS PAGES
    |--------------------------------------------------------------------------
    |
    | Missing default pages create થશે.
    |
    | Existing edited pages overwrite નહીં થાય.
    |
    |--------------------------------------------------------------------------
    */

    await ensureDefaultCmsPages();

    /*
    |--------------------------------------------------------------------------
    | GET SEARCH PARAMS
    |--------------------------------------------------------------------------
    */

    const searchParams =
      request.nextUrl.searchParams;

    const sectionParam =
      searchParams.get("section");

    /*
    |--------------------------------------------------------------------------
    | VALIDATE SECTION
    |--------------------------------------------------------------------------
    */

    let section:
      | CmsSection
      | undefined;

    if (
      sectionParam === "help" ||
      sectionParam === "policy"
    ) {
      section = sectionParam;
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD PUBLISHED PAGES
    |--------------------------------------------------------------------------
    |
    | અહીં "Published" ને `as const` રાખવું important છે.
    |
    | નહિ તો TypeScript એને generic string ગણતું હતું અને
    | Mongoose CmsPageStatus સાથે type mismatch આપતું હતું.
    |
    |--------------------------------------------------------------------------
    */

    const pages = section
      ? await CmsPage.find({
          status:
            "Published" as const,

          section,
        })
          .select(
            [
              "_id",

              "title",
              "slug",

              "section",

              "pageType",

              "shortDescription",

              "sortOrder",

              "externalUrl",

              "whatsappNumber",
              "whatsappMessage",

              "icon",
            ].join(" ")
          )
          .sort({
            sortOrder: 1,
            title: 1,
          })
          .lean()
      : await CmsPage.find({
          status:
            "Published" as const,
        })
          .select(
            [
              "_id",

              "title",
              "slug",

              "section",

              "pageType",

              "shortDescription",

              "sortOrder",

              "externalUrl",

              "whatsappNumber",
              "whatsappMessage",

              "icon",
            ].join(" ")
          )
          .sort({
            section: 1,
            sortOrder: 1,
            title: 1,
          })
          .lean();

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        count:
          pages.length,

        pages,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "CMS LIST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to load content.",
      },
      {
        status: 500,
      }
    );
  }
}