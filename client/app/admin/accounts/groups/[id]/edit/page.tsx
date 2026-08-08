"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  Loader2,
} from "lucide-react";

type AccountType =
  | "ASSET"
  | "LIABILITY"
  | "INCOME"
  | "EXPENSE"
  | "EQUITY";

type ParentGroup = {
  _id: string;
  name: string;
  code: string;
};

const accountTypes: AccountType[] = [
  "ASSET",
  "LIABILITY",
  "INCOME",
  "EXPENSE",
  "EQUITY",
];

export default function EditAccountGroupPage() {
  const router = useRouter();

  const params =
    useParams<{
      id: string;
    }>();

  const id = params.id;

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [groups, setGroups] =
    useState<ParentGroup[]>([]);

  const [form, setForm] =
    useState({
      name: "",

      code: "",

      type:
        "ASSET" as AccountType,

      parent: "",

      description: "",

      isActive: true,
    });

  async function fetchParentGroups() {
    try {
      const res =
        await fetch(
          "/api/admin/accounts/groups?limit=500",
          {
            cache:
              "no-store",
          }
        );

      const data =
        await res.json();

      if (data.success) {
        setGroups(
          data.groups ||
            data.data ||
            []
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchGroup() {
    try {
      const res =
        await fetch(
          `/api/admin/accounts/groups/${id}`,
          {
            cache:
              "no-store",
          }
        );

      const data =
        await res.json();

      if (!data.success) {
        alert(
          data.message
        );

        router.push(
          "/admin/accounts/groups"
        );

        return;
      }

      const group =
        data.group;

      setForm({
        name:
          group.name,

        code:
          group.code,

        type:
          group.type,

        parent:
          group.parent?._id ||
          "",

        description:
          group.description ||
          "",

        isActive:
          group.isActive,
      });
    } catch (error) {
      console.error(error);

      alert(
        "Unable to load account group."
      );

      router.push(
        "/admin/accounts/groups"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;

    fetchParentGroups();

    fetchGroup();
  }, [id]);
    async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Group name is required.");
      return;
    }

    if (!form.code.trim()) {
      alert("Group code is required.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(
        `/api/admin/accounts/groups/${id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: form.name.trim(),

            code: form.code
              .trim()
              .toUpperCase(),

            type: form.type,

            parent:
              form.parent || null,

            description:
              form.description.trim(),

            isActive:
              form.isActive,
          }),
        }
      );

      const data =
        await res.json();

      if (!data.success) {
        alert(
          data.message ||
            "Unable to update group."
        );
        return;
      }

      alert(
        "Account group updated successfully."
      );

      router.push(
        "/admin/accounts/groups"
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      alert(
        "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">

      <div className="mb-6">

        <h1 className="text-2xl font-bold">
          Edit Account Group
        </h1>

        <p className="text-sm text-gray-500">
          Update account group details
        </p>

      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-5 rounded-xl border p-6"
      >

        <div>

          <label className="mb-1 block text-sm font-medium">
            Group Name
          </label>

          <input
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name:
                  e.target.value,
              })
            }
            className="w-full rounded-lg border px-3 py-2"
          />

        </div>

        <div>

          <label className="mb-1 block text-sm font-medium">
            Group Code
          </label>

          <input
            value={form.code}
            onChange={(e) =>
              setForm({
                ...form,
                code:
                  e.target.value.toUpperCase(),
              })
            }
            className="w-full rounded-lg border px-3 py-2"
          />

        </div>

        <div>

          <label className="mb-1 block text-sm font-medium">
            Account Type
          </label>

          <select
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type:
                  e.target
                    .value as AccountType,
              })
            }
            className="w-full rounded-lg border px-3 py-2"
          >

            {accountTypes.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              )
            )}

          </select>

        </div>
                <div>

          <label className="mb-1 block text-sm font-medium">
            Parent Group
          </label>

          <select
            value={form.parent}
            onChange={(e) =>
              setForm({
                ...form,
                parent: e.target.value,
              })
            }
            className="w-full rounded-lg border px-3 py-2"
          >

            <option value="">
              No Parent (Root)
            </option>

            {groups
              .filter(
                (group) =>
                  group._id !== id
              )
              .map((group) => (
                <option
                  key={group._id}
                  value={group._id}
                >
                  {group.name} ({group.code})
                </option>
              ))}

          </select>

        </div>

        <div>

          <label className="mb-1 block text-sm font-medium">
            Description
          </label>

          <textarea
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description:
                  e.target.value,
              })
            }
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Optional description"
          />

        </div>

        <div className="flex items-center gap-3">

          <input
            id="isActive"
            type="checkbox"
            checked={form.isActive}
            onChange={(e) =>
              setForm({
                ...form,
                isActive:
                  e.target.checked,
              })
            }
          />

          <label
            htmlFor="isActive"
            className="text-sm font-medium"
          >
            Active
          </label>

        </div>

        <div className="flex gap-3">

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="rounded-lg border px-5 py-2"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-5 py-2 text-white disabled:opacity-50"
          >
            {saving
              ? "Updating..."
              : "Update Group"}
          </button>

        </div>

      </form>

    </div>
  );
}