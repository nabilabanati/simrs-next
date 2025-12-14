import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Seed ALL region data (provinces, regencies, districts, villages) from wilayah.id API
 * This will take a few minutes to complete
 * 
 * Usage: POST to /api/regions/seed-all
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST to seed data.' });
    }

    try {
        const results = {
            provinces: 0,
            regencies: 0,
            districts: 0,
            villages: 0,
        };

        // 1. Seed Provinces
        console.log('Fetching provinces...');
        const provincesRes = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        const provincesData = await provincesRes.json();

        const provinces = provincesData.map((p: any) => ({ id: p.id, name: p.name }));
        await supabaseServer.from('provinces').upsert(provinces, { onConflict: 'id' });
        results.provinces = provinces.length;
        console.log(`✓ Seeded ${results.provinces} provinces`);

        // 2. Seed Regencies (for each province)
        console.log('Fetching regencies...');
        for (const province of provincesData) {
            const regenciesRes = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${province.id}.json`);
            const regenciesData = await regenciesRes.json();

            const regencies = regenciesData.map((r: any) => ({
                id: r.id,
                province_id: r.province_id,
                name: r.name,
            }));

            if (regencies.length > 0) {
                await supabaseServer.from('regencies').upsert(regencies, { onConflict: 'id' });
                results.regencies += regencies.length;
            }
        }
        console.log(`✓ Seeded ${results.regencies} regencies`);

        // 3. Seed Districts (for each regency)
        console.log('Fetching districts...');
        const { data: allRegencies } = await supabaseServer.from('regencies').select('id');

        for (const regency of allRegencies || []) {
            const districtsRes = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regency.id}.json`);
            const districtsData = await districtsRes.json();

            const districts = districtsData.map((d: any) => ({
                id: d.id,
                regency_id: d.regency_id,
                name: d.name,
            }));

            if (districts.length > 0) {
                await supabaseServer.from('districts').upsert(districts, { onConflict: 'id' });
                results.districts += districts.length;
            }
        }
        console.log(`✓ Seeded ${results.districts} districts`);

        // 4. Seed Villages (for each district) - This will take a while!
        console.log('Fetching villages... (this may take several minutes)');
        const { data: allDistricts } = await supabaseServer.from('districts').select('id');

        for (const district of allDistricts || []) {
            const villagesRes = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${district.id}.json`);
            const villagesData = await villagesRes.json();

            const villages = villagesData.map((v: any) => ({
                id: v.id,
                district_id: v.district_id,
                name: v.name,
            }));

            if (villages.length > 0) {
                await supabaseServer.from('villages').upsert(villages, { onConflict: 'id' });
                results.villages += villages.length;
            }
        }
        console.log(`✓ Seeded ${results.villages} villages`);

        return res.status(200).json({
            success: true,
            message: 'Successfully seeded all region data',
            results,
        });
    } catch (error: any) {
        console.error('Error seeding regions:', error);
        return res.status(500).json({
            error: 'Failed to seed regions',
            message: error?.message || 'Unknown error',
        });
    }
}
