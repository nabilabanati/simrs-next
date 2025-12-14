const BASE = "https://wilayah.id/api";

export async function fetchProvinces() {
  const res = await fetch(`${BASE}/provinces.json`);
  return res.json();
}

export async function fetchRegencies(provinceId: string) {
  const res = await fetch(`${BASE}/regencies/${provinceId}.json`);
  return res.json();
}

export async function fetchDistricts(regencyId: string) {
  const res = await fetch(`${BASE}/districts/${regencyId}.json`);
  return res.json();
}

export async function fetchVillages(districtId: string) {
  const res = await fetch(`${BASE}/villages/${districtId}.json`);
  return res.json();
}
