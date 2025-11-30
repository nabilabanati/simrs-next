import type { Clinic } from '@/pages/api/clinics';
import type { Doctor } from '@/pages/api/doctors';
import type { PaymentMethod } from '@/pages/api/payment-methods';
import type { Province } from '@/pages/api/provinces';
import type { City } from '@/pages/api/cities';
import type { District } from '@/pages/api/districts';
import type { Village } from '@/pages/api/villages';

// Fetch clinics
export async function fetchClinics(): Promise<Clinic[]> {
  try {
    const response = await fetch('/api/clinics');
    if (!response.ok) throw new Error('Failed to fetch clinics');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching clinics:', error);
    return [];
  }
}

// Fetch doctors by clinic
export async function fetchDoctorsByClinic(clinic: string): Promise<Doctor[]> {
  try {
    const response = await fetch(`/api/doctors?clinic=${encodeURIComponent(clinic)}`);
    if (!response.ok) throw new Error('Failed to fetch doctors');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
}

// Fetch all doctors
export async function fetchAllDoctors(): Promise<Doctor[]> {
  try {
    const response = await fetch('/api/doctors');
    if (!response.ok) throw new Error('Failed to fetch doctors');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
}

// Fetch payment methods
export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const response = await fetch('/api/payment-methods');
    if (!response.ok) throw new Error('Failed to fetch payment methods');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return [];
  }
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
