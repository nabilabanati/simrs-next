export function capitalize(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function upper(str: string) {
  return str?.toUpperCase();
}

export function lower(str: string) {
  return str?.toLowerCase();
}
