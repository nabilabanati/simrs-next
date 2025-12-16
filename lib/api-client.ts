// Interfaces for API responses
export interface Poli {
  id: string;
  name: string;
  code: string;
  harga_daftar: number;
}

export interface Doctor {
  id: string;
  name: string;
  clinic: string;
  specialization: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  description: string;
}

// Fetch poli (using simple API for dropdown - no auth needed)
export async function fetchPoli(): Promise<Poli[]> {
  try {
    const response = await fetch('/api/poli');
    if (!response.ok) {
      console.error('Fetch poli failed:', response.status, response.statusText);
      throw new Error('Failed to fetch poli');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching poli:', error);
    return [];
  }
}

// Fetch all doctors from simple API (no auth needed)
export async function fetchAllDoctors(): Promise<Doctor[]> {
  try {
    const response = await fetch('/api/doctors');
    if (!response.ok) {
      console.error('Fetch doctors failed:', response.status, response.statusText);
      throw new Error('Failed to fetch doctors');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
}

// Fetch doctors by clinic (filter client-side)
export async function fetchDoctorsByClinic(clinic: string): Promise<Doctor[]> {
  const allDoctors = await fetchAllDoctors();
  return allDoctors.filter((doc) => doc.clinic === clinic);
}

// Fetch payment methods (using simple API for dropdown - no auth needed)
export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const response = await fetch('/api/penjamin');
    if (!response.ok) {
      console.error('Fetch payment methods failed:', response.status, response.statusText);
      throw new Error('Failed to fetch payment methods');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return [];
  }
}

// Region API types
export interface Province {
  code: string;
  name: string;
}

export interface City {
  code: string;
  name: string;
}

export interface District {
  code: string;
  name: string;
}

export interface Village {
  code: string;
  name: string;
  postal_code: string;
}


// Fetch provinces
export async function fetchProvinces(): Promise<Province[]> {
  try {
    const response = await fetch('/api/provinces');
    if (!response.ok) throw new Error('Failed to fetch provinces');
    return await response.json();
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return [];
  }
}

// Fetch cities by province
export async function fetchCitiesByProvince(provinceId: string): Promise<City[]> {
  try {
    const response = await fetch(`/api/cities?provinceId=${encodeURIComponent(provinceId)}`);
    if (!response.ok) throw new Error('Failed to fetch cities');
    return await response.json();
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
}

// Fetch all cities
export async function fetchAllCities(): Promise<City[]> {
  try {
    const response = await fetch('/api/cities');
    if (!response.ok) throw new Error('Failed to fetch cities');
    return await response.json();
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
}

// Fetch districts by city
export async function fetchDistrictsByCity(cityId: string): Promise<District[]> {
  try {
    const response = await fetch(`/api/districts?cityId=${encodeURIComponent(cityId)}`);
    if (!response.ok) throw new Error('Failed to fetch districts');
    return await response.json();
  } catch (error) {
    console.error('Error fetching districts:', error);
    return [];
  }
}

// Fetch all districts
export async function fetchAllDistricts(): Promise<District[]> {
  try {
    const response = await fetch('/api/districts');
    if (!response.ok) throw new Error('Failed to fetch districts');
    return await response.json();
  } catch (error) {
    console.error('Error fetching districts:', error);
    return [];
  }
}

// Fetch villages by district
export async function fetchVillagesByDistrict(districtId: string): Promise<Village[]> {
  try {
    const response = await fetch(`/api/villages?districtId=${encodeURIComponent(districtId)}`);
    if (!response.ok) throw new Error('Failed to fetch villages');
    return await response.json();
  } catch (error) {
    console.error('Error fetching villages:', error);
    return [];
  }
}

// Fetch all villages
export async function fetchAllVillages(): Promise<Village[]> {
  try {
    const response = await fetch('/api/villages');
    if (!response.ok) throw new Error('Failed to fetch villages');
    return await response.json();
  } catch (error) {
    console.error('Error fetching villages:', error);
    return [];
  }
}
