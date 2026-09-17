import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| ACTION STATUS
|--------------------------------------------------------------------------
*/

export type AIActionStatus =
  | "requested"
  | "completed"
  | "failed"
  | "rejected";

/*
|--------------------------------------------------------------------------
| ACTION LOG DOCUMENT
|--------------------------------------------------------------------------
*/

export interface IAIActionLog
  extends Document {
  userId?:
    | Types.ObjectId
    | null;

  conversationId?:
    | Types.ObjectId
    | null;

  action:
    string;

  toolName:
    string;

  status:
    AIActionStatus;

  requiresConfirmation:
    boolean;

  confirmedByUser:
    boolean;

  /*
  |--------------------------------------------------------------------------
  | CONFIRMATION TIMESTAMPS
  |--------------------------------------------------------------------------
  */

  confirmationRequestedAt?:
    | Date
    | null;

  confirmedAt?:
    | Date
    | null;

  rejectedAt?:
    | Date
    | null;

  /*
  |--------------------------------------------------------------------------
  | TOOL DATA
  |--------------------------------------------------------------------------
  */

  input?:
    Record<
      string,
      unknown
    >;

  output?:
    Record<
      string,
      unknown
    >;

  errorMessage?:
    string;

  createdAt:
    Date;

  updatedAt:
    Date;
}

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const MAX_ACTION_LENGTH =
  120;

const MAX_TOOL_NAME_LENGTH =
  120;

const MAX_ERROR_LENGTH =
  2000;

/*
|--------------------------------------------------------------------------
| CLEAN STRING
|--------------------------------------------------------------------------
*/

function cleanString(
  value:
    unknown,
  maxLength:
    number
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value
    .trim()
    .replace(
      /\s+/g,
      " "
    )
    .slice(
      0,
      maxLength
    );
}

/*
|--------------------------------------------------------------------------
| VALID DATE
|--------------------------------------------------------------------------
*/

function normalizeDate(
  value:
    unknown
):
  | Date
  | null {
  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {
    return null;
  }

  if (
    value instanceof
      Date
  ) {
    return Number.isNaN(
      value.getTime()
    )
      ? null
      : value;
  }

  const parsed =
    new Date(
      value as
        string | number
    );

  return Number.isNaN(
    parsed.getTime()
  )
    ? null
    : parsed;
}

/*
|--------------------------------------------------------------------------
| NORMALIZE OBJECT
|--------------------------------------------------------------------------
*/

function normalizeObject(
  value:
    unknown
): Record<
  string,
  unknown
> {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value
    )
  ) {
    return {};
  }

  return value as
    Record<
      string,
      unknown
    >;
}

/*
|--------------------------------------------------------------------------
| SCHEMA
|--------------------------------------------------------------------------
*/

const AIActionLogSchema =
  new Schema<IAIActionLog>(
    {
      /*
      |--------------------------------------------------------------------------
      | CUSTOMER
      |--------------------------------------------------------------------------
      |
      | null = guest / unauthenticated context
      |
      */

      userId: {
        type:
          Schema.Types.ObjectId,

        ref:
          "User",

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | CONVERSATION
      |--------------------------------------------------------------------------
      */

      conversationId: {
        type:
          Schema.Types.ObjectId,

        ref:
          "AIConversation",

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | ACTION
      |--------------------------------------------------------------------------
      */

      action: {
        type:
          String,

        required:
          true,

        trim:
          true,

        maxlength:
          MAX_ACTION_LENGTH,
      },

      /*
      |--------------------------------------------------------------------------
      | TOOL NAME
      |--------------------------------------------------------------------------
      */

      toolName: {
        type:
          String,

        required:
          true,

        trim:
          true,

        maxlength:
          MAX_TOOL_NAME_LENGTH,
      },

      /*
      |--------------------------------------------------------------------------
      | STATUS
      |--------------------------------------------------------------------------
      */

      status: {
        type:
          String,

        enum: [
          "requested",
          "completed",
          "failed",
          "rejected",
        ],

        default:
          "requested",
      },

      /*
      |--------------------------------------------------------------------------
      | CONFIRMATION REQUIRED
      |--------------------------------------------------------------------------
      */

      requiresConfirmation: {
        type:
          Boolean,

        default:
          false,
      },

      /*
      |--------------------------------------------------------------------------
      | CONFIRMED BY REAL CUSTOMER
      |--------------------------------------------------------------------------
      |
      | IMPORTANT:
      |
      | This must be set by server-controlled confirmation logic.
      |
      | Never trust model-generated:
      |
      | confirmed: true
      |
      | by itself.
      |
      */

      confirmedByUser: {
        type:
          Boolean,

        default:
          false,
      },

      /*
      |--------------------------------------------------------------------------
      | CONFIRMATION REQUESTED
      |--------------------------------------------------------------------------
      */

      confirmationRequestedAt: {
        type:
          Date,

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | CONFIRMED
      |--------------------------------------------------------------------------
      */

      confirmedAt: {
        type:
          Date,

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | REJECTED
      |--------------------------------------------------------------------------
      */

      rejectedAt: {
        type:
          Date,

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | TOOL INPUT
      |--------------------------------------------------------------------------
      */

      input: {
        type:
          Schema.Types.Mixed,

        default:
          {},
      },

      /*
      |--------------------------------------------------------------------------
      | TOOL OUTPUT
      |--------------------------------------------------------------------------
      */

      output: {
        type:
          Schema.Types.Mixed,

        default:
          {},
      },

      /*
      |--------------------------------------------------------------------------
      | ERROR
      |--------------------------------------------------------------------------
      */

      errorMessage: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_ERROR_LENGTH,
      },
    },
    {
      timestamps:
        true,

      versionKey:
        false,
    }
  );

/*
|--------------------------------------------------------------------------
| PRE VALIDATE NORMALIZATION
|--------------------------------------------------------------------------
|
| Mongoose 9 compatible.
|
| Do NOT use next().
|
|--------------------------------------------------------------------------
*/

AIActionLogSchema.pre(
  "validate",
  function () {
    /*
    |--------------------------------------------------------------------------
    | ACTION
    |--------------------------------------------------------------------------
    */

    this.action =
      cleanString(
        this.action,
        MAX_ACTION_LENGTH
      );

    /*
    |--------------------------------------------------------------------------
    | TOOL
    |--------------------------------------------------------------------------
    */

    this.toolName =
      cleanString(
        this.toolName,
        MAX_TOOL_NAME_LENGTH
      );

    /*
    |--------------------------------------------------------------------------
    | ERROR
    |--------------------------------------------------------------------------
    */

    this.errorMessage =
      cleanString(
        this.errorMessage,
        MAX_ERROR_LENGTH
      );

    /*
    |--------------------------------------------------------------------------
    | INPUT / OUTPUT
    |--------------------------------------------------------------------------
    */

    this.input =
      normalizeObject(
        this.input
      );

    this.output =
      normalizeObject(
        this.output
      );

    /*
    |--------------------------------------------------------------------------
    | DATES
    |--------------------------------------------------------------------------
    */

    this.confirmationRequestedAt =
      normalizeDate(
        this.confirmationRequestedAt
      );

    this.confirmedAt =
      normalizeDate(
        this.confirmedAt
      );

    this.rejectedAt =
      normalizeDate(
        this.rejectedAt
      );

    /*
    |--------------------------------------------------------------------------
    | NON-CONFIRMATION ACTION
    |--------------------------------------------------------------------------
    |
    | If an action never requires customer confirmation,
    | confirmation state must remain empty.
    |
    |--------------------------------------------------------------------------
    */

    if (
      !this.requiresConfirmation
    ) {
      this.confirmedByUser =
        false;

      this.confirmationRequestedAt =
        null;

      this.confirmedAt =
        null;

      this.rejectedAt =
        null;

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | WAITING FOR CONFIRMATION
    |--------------------------------------------------------------------------
    |
    | Only a requested action represents a pending confirmation.
    |
    |--------------------------------------------------------------------------
    */

    if (
      this.status ===
      "requested"
    ) {
      this.confirmedByUser =
        false;

      this.confirmedAt =
        null;

      this.rejectedAt =
        null;

      if (
        !this.confirmationRequestedAt
      ) {
        this.confirmationRequestedAt =
          new Date();
      }

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | REJECTED
    |--------------------------------------------------------------------------
    */

    if (
      this.status ===
      "rejected"
    ) {
      this.confirmedByUser =
        false;

      this.confirmedAt =
        null;

      if (
        !this.rejectedAt
      ) {
        this.rejectedAt =
          new Date();
      }

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | CONFIRMED ACTION
    |--------------------------------------------------------------------------
    |
    | completed/failed can still represent an action which was
    | genuinely confirmed by the customer before execution.
    |
    |--------------------------------------------------------------------------
    */

    if (
      this.confirmedByUser
    ) {
      if (
        !this.confirmedAt
      ) {
        this.confirmedAt =
          new Date();
      }

      this.rejectedAt =
        null;
    } else {
      /*
      |--------------------------------------------------------------------------
      | DO NOT INVENT CONFIRMATION
      |--------------------------------------------------------------------------
      */

      this.confirmedAt =
        null;
    }
  }
);

/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CUSTOMER ACTION HISTORY
|--------------------------------------------------------------------------
*/

AIActionLogSchema.index(
  {
    userId:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "ai_action_user_created",
  }
);

/*
|--------------------------------------------------------------------------
| CONVERSATION ACTION HISTORY
|--------------------------------------------------------------------------
*/

AIActionLogSchema.index(
  {
    conversationId:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "ai_action_conversation_created",
  }
);

/*
|--------------------------------------------------------------------------
| TOOL HISTORY
|--------------------------------------------------------------------------
*/

AIActionLogSchema.index(
  {
    toolName:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "ai_action_tool_created",
  }
);

/*
|--------------------------------------------------------------------------
| STATUS HISTORY
|--------------------------------------------------------------------------
*/

AIActionLogSchema.index(
  {
    status:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "ai_action_status_created",
  }
);

/*
|--------------------------------------------------------------------------
| CONFIRMATION STATUS HISTORY
|--------------------------------------------------------------------------
*/

AIActionLogSchema.index(
  {
    requiresConfirmation:
      1,

    status:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "ai_action_confirmation_status_created",
  }
);

/*
|--------------------------------------------------------------------------
| CUSTOMER + TOOL HISTORY
|--------------------------------------------------------------------------
*/

AIActionLogSchema.index(
  {
    userId:
      1,

    toolName:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "ai_action_user_tool_created",
  }
);

/*
|--------------------------------------------------------------------------
| SECURE PENDING CONFIRMATION LOOKUP
|--------------------------------------------------------------------------
|
| This matches the important chat-route lookup:
|
| - same conversation
| - same authenticated customer
| - consequential action
| - requested status
| - specific tool
|
|--------------------------------------------------------------------------
*/

AIActionLogSchema.index(
  {
    conversationId:
      1,

    userId:
      1,

    requiresConfirmation:
      1,

    status:
      1,

    toolName:
      1,

    confirmationRequestedAt:
      -1,
  },
  {
    name:
      "ai_action_pending_confirmation",
  }
);

/*
|--------------------------------------------------------------------------
| CONFIRMATION EXPIRY / AUDIT LOOKUP
|--------------------------------------------------------------------------
*/

AIActionLogSchema.index(
  {
    confirmationRequestedAt:
      -1,
  },
  {
    name:
      "ai_action_confirmation_requested_at",

    partialFilterExpression: {
      requiresConfirmation:
        true,

      confirmationRequestedAt: {
        $type:
          "date",
      },
    },
  }
);

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const AIActionLog =
  (
    mongoose.models
      .AIActionLog as
      Model<IAIActionLog>
  ) ||
  mongoose.model<IAIActionLog>(
    "AIActionLog",
    AIActionLogSchema
  );

export default AIActionLog;