import { supabase } from '@/lib/supabase';

/**
 * Generate registration number in format: KODE-YYYYMMDD-XXX
 * Example: UMUM-20251216-001
 */
export async function generateRegistrationNumber(
  poliCode: string,
  poliId: string
): Promise<string> {
  try {
    // Get today's date in YYYYMMDD format
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // Get start of today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    console.log('Generating registration number for:', { poliCode, poliId, dateStr });

    // Count visits for this poli today - using 'no_reg' field
    const { data, error } = await supabase
      .from('visits')
      .select('no_reg')
      .eq('poli_id', poliId)
      .gte('created_at', todayStart.toISOString())
      .like('no_reg', `${poliCode}-${dateStr}-%`)
      .order('no_reg', { ascending: false })
      .limit(1);

    console.log('Query result:', { data, error });

    if (error) {
      console.error('Error fetching last registration number:', error);
      // If error, start from 001
      return `${poliCode}-${dateStr}-001`;
    }

    // Get next increment
    let increment = 1;
    if (data && data.length > 0 && data[0].no_reg) {
      const lastNo = data[0].no_reg;
      console.log('Last registration number:', lastNo);
      const parts = lastNo.split('-');
      if (parts.length === 3) {
        const lastIncrement = parseInt(parts[2]);
        if (!isNaN(lastIncrement)) {
          increment = lastIncrement + 1;
        }
      }
    }

    // Format: KODE-YYYYMMDD-XXX
    const registrationNo = `${poliCode}-${dateStr}-${String(increment).padStart(3, '0')}`;
    
    console.log('Generated registration number:', registrationNo);
    
    return registrationNo;
  } catch (error) {
    console.error('Error generating registration number:', error);
    // Fallback to timestamp-based number
    return `${poliCode}-${Date.now()}`;
  }
}
