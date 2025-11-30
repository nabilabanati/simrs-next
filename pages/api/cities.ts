import type { NextApiRequest, NextApiResponse } from 'next';

export interface City {
  id: string;
  name: string;
  provinceId: string;
  code: string;
}

const cities: City[] = [
  // Jawa Tengah (11)
  { id: '1101', name: 'Banyumas', provinceId: '11', code: 'BMS' },
  { id: '1102', name: 'Purwokerto', provinceId: '11', code: 'PWK' },
  { id: '1103', name: 'Cilacap', provinceId: '11', code: 'CLP' },
  { id: '1104', name: 'Kebumen', provinceId: '11', code: 'KBM' },
  { id: '1105', name: 'Wonosobo', provinceId: '11', code: 'WNS' },
  { id: '1106', name: 'Semarang', provinceId: '11', code: 'SMG' },
  { id: '1107', name: 'Salatiga', provinceId: '11', code: 'SLT' },
  { id: '1108', name: 'Pekalongan', provinceId: '11', code: 'PKL' },

  // Jawa Barat (12)
  { id: '1201', name: 'Bandung', provinceId: '12', code: 'BDG' },
  { id: '1202', name: 'Bekasi', provinceId: '12', code: 'BKS' },
  { id: '1203', name: 'Bogor', provinceId: '12', code: 'BGR' },
  { id: '1204', name: 'Depok', provinceId: '12', code: 'DPK' },
  { id: '1205', name: 'Tasikmalaya', provinceId: '12', code: 'TSM' },
  { id: '1206', name: 'Cirebon', provinceId: '12', code: 'CRB' },

  // Jawa Timur (13)
  { id: '1301', name: 'Surabaya', provinceId: '13', code: 'SBY' },
  { id: '1302', name: 'Malang', provinceId: '13', code: 'MLG' },
  { id: '1303', name: 'Sidoarjo', provinceId: '13', code: 'SDA' },
  { id: '1304', name: 'Gresik', provinceId: '13', code: 'GSK' },
  { id: '1305', name: 'Pasuruan', provinceId: '13', code: 'PSR' },

  // DKI Jakarta (14)
  { id: '1401', name: 'Jakarta Pusat', provinceId: '14', code: 'JKP' },
  { id: '1402', name: 'Jakarta Selatan', provinceId: '14', code: 'JKS' },
  { id: '1403', name: 'Jakarta Utara', provinceId: '14', code: 'JKU' },
  { id: '1404', name: 'Jakarta Barat', provinceId: '14', code: 'JKB' },
  { id: '1405', name: 'Jakarta Timur', provinceId: '14', code: 'JKT' },

  // Bali (15)
  { id: '1501', name: 'Denpasar', provinceId: '15', code: 'DNS' },
  { id: '1502', name: 'Ubud', provinceId: '15', code: 'UBD' },
  { id: '1503', name: 'Sanur', provinceId: '15', code: 'SNR' },
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<City[] | { error: string }>
) {
  if (req.method === 'GET') {
    const { provinceId } = req.query;

    if (!provinceId) {
      return res.status(200).json(cities);
    }

    const filtered = cities.filter((city) => city.provinceId === provinceId);
    return res.status(200).json(filtered);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
