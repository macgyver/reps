export function optionalText(formData: FormData, field: string) {
  let value = formData.get(field);
  if (typeof value !== "string") return null;
  let trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function parseNumber(formData: FormData, field: string): number | null {
  let raw = formData.get(field);
  return typeof raw === "string" && raw.trim() ? Number(raw) : null;
}
