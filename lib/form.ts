export function optionalText(formData: FormData, field: string) {
  let value = formData.get(field);
  if (typeof value !== "string") return null;
  let trimmed = value.trim();
  return trimmed ? trimmed : null;
}
