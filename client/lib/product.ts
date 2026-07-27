export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function generateSKU(count: number): string {
  return `SG${String(count).padStart(6, "0")}`;
}

export function parseArray(value: string): string[] {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseBoolean(value: string): boolean {
  if (!value) return false;

  return ["yes", "true", "1"]
    .includes(value.toLowerCase());
}
