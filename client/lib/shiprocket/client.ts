const SHIPROCKET_BASE_URL =
  "https://apiv2.shiprocket.in/v1/external";

type ShiprocketTokenCache = {
  token: string;
  expiresAt: number;
};

let tokenCache: ShiprocketTokenCache | null =
  null;

function getCredentials() {
  const email =
    process.env.SHIPROCKET_EMAIL?.trim();

  const password =
    process.env.SHIPROCKET_PASSWORD?.trim();

  if (!email || !password) {
    throw new Error(
      "SHIPROCKET_NOT_CONFIGURED"
    );
  }

  return {
    email,
    password,
  };
}

async function parseResponse(
  response: Response
) {
  const text =
    await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

export function isShiprocketConfigured() {
  return Boolean(
    process.env.SHIPROCKET_EMAIL?.trim() &&
      process.env.SHIPROCKET_PASSWORD?.trim()
  );
}

export async function getShiprocketToken() {
  /*
  |--------------------------------------------------------------------------
  | REUSE CACHED TOKEN
  |--------------------------------------------------------------------------
  */

  if (
    tokenCache &&
    tokenCache.token &&
    Date.now() <
      tokenCache.expiresAt
  ) {
    return tokenCache.token;
  }

  const {
    email,
    password,
  } =
    getCredentials();

  const response =
    await fetch(
      `${SHIPROCKET_BASE_URL}/auth/login`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        body:
          JSON.stringify(
            {
              email,
              password,
            }
          ),

        cache:
          "no-store",
      }
    );

  const data =
    await parseResponse(
      response
    );

  if (
    !response.ok ||
    !data?.token
  ) {
    throw new Error(
      data?.message ||
        "Unable to authenticate with Shiprocket."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SHIPROCKET TOKEN IS DOCUMENTED AS 10 DAYS.
  | CACHE FOR 9 DAYS TO LEAVE SAFETY MARGIN.
  |--------------------------------------------------------------------------
  */

  tokenCache = {
    token:
      String(
        data.token
      ),

    expiresAt:
      Date.now() +
      9 *
        24 *
        60 *
        60 *
        1000,
  };

  return tokenCache.token;
}

export async function shiprocketRequest<T = any>(
  path: string,
  options?: {
    method?:
      | "GET"
      | "POST"
      | "PUT"
      | "PATCH"
      | "DELETE";

    body?: unknown;
  }
): Promise<T> {
  const token =
    await getShiprocketToken();

  const method =
    options?.method ||
    "GET";

  const response =
    await fetch(
      `${SHIPROCKET_BASE_URL}${path}`,
      {
        method,

        headers: {
          Authorization:
            `Bearer ${token}`,

          Accept:
            "application/json",

          ...(options?.body !==
          undefined
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),
        },

        body:
          options?.body !==
          undefined
            ? JSON.stringify(
                options.body
              )
            : undefined,

        cache:
          "no-store",
      }
    );

  const data =
    await parseResponse(
      response
    );

  /*
  |--------------------------------------------------------------------------
  | TOKEN EXPIRED / INVALID
  |--------------------------------------------------------------------------
  */

  if (
    response.status ===
      401 &&
    tokenCache
  ) {
    tokenCache =
      null;

    const refreshedToken =
      await getShiprocketToken();

    const retry =
      await fetch(
        `${SHIPROCKET_BASE_URL}${path}`,
        {
          method,

          headers: {
            Authorization:
              `Bearer ${refreshedToken}`,

            Accept:
              "application/json",

            ...(options?.body !==
            undefined
              ? {
                  "Content-Type":
                    "application/json",
                }
              : {}),
          },

          body:
            options?.body !==
            undefined
              ? JSON.stringify(
                  options.body
                )
              : undefined,

          cache:
            "no-store",
        }
      );

    const retryData =
      await parseResponse(
        retry
      );

    if (
      !retry.ok
    ) {
      throw new Error(
        retryData?.message ||
          "Shiprocket request failed."
      );
    }

    return retryData as T;
  }

  if (
    !response.ok
  ) {
    throw new Error(
      data?.message ||
        "Shiprocket request failed."
    );
  }

  return data as T;
}

/*
|--------------------------------------------------------------------------
| TRACK AWB
|--------------------------------------------------------------------------
*/

export async function trackShiprocketAWB(
  awb:
    string
) {
  const cleanAwb =
    String(
      awb ||
        ""
    ).trim();

  if (
    !cleanAwb
  ) {
    return {
      success:
        false,

      message:
        "AWB number is not available.",
    };
  }

  try {
    const data =
      await shiprocketRequest<any>(
        `/courier/track/awb/${encodeURIComponent(
          cleanAwb
        )}`
      );

    return {
      success:
        true,

      awb:
        cleanAwb,

      data,
    };
  } catch (
    error
  ) {
    return {
      success:
        false,

      awb:
        cleanAwb,

      message:
        error instanceof
        Error
          ? error.message
          : "Unable to track shipment.",
    };
  }
}