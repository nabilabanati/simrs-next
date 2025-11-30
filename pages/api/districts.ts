import type { NextApiRequest, NextApiResponse } from 'next';

export interface District {
  id: string;
  name: string;
  cityId: string;
  code: string;
}

const districts: District[] = [
  // Banyumas
  { id: '110101', name: 'Purwokerto Utara', cityId: '1102', code: 'PWU' },
  { id: '110102', name: 'Purwokerto Selatan', cityId: '1102', code: 'PWS' },
  { id: '110103', name: 'Purwokerto Timur', cityId: '1102', code: 'PWT' },
  { id: '110104', name: 'Purwokerto Barat', cityId: '1102', code: 'PWB' },
  { id: '110105', name: 'Ajibarang', cityId: '1102', code: 'AJB' },
  { id: '110106', name: 'Jatilawang', cityId: '1102', code: 'JTL' },

  // Cilacap
  { id: '110301', name: 'Cilacap Selatan', cityId: '1103', code: 'CLS' },
  { id: '110302', name: 'Cilacap Tengah', cityId: '1103', code: 'CLT' },
  { id: '110303', name: 'Cilacap Utara', cityId: '1103', code: 'CLU' },
  { id: '110304', name: 'Maos', cityId: '1103', code: 'MOS' },

  // Kebumen
  { id: '110401', name: 'Kebumen', cityId: '1104', code: 'KBM' },
  { id: '110402', name: 'Karanggayam', cityId: '1104', code: 'KRG' },
  { id: '110403', name: 'Pejagoan', cityId: '1104', code: 'PJG' },
  { id: '110404', name: 'Klirong', cityId: '1104', code: 'KLR' },

  // Bandung
  { id: '120101', name: 'Bandung', cityId: '1201', code: 'BDG' },
  { id: '120102', name: 'Cibeunying Kidul', cityId: '1201', code: 'CBK' },
  { id: '120103', name: 'Cibeunying Kaler', cityId: '1201', code: 'CBL' },
  { id: '120104', name: 'Rancasari', cityId: '1201', code: 'RCS' },
  { id: '120105', name: 'Babakan Ciparay', cityId: '1201', code: 'BCP' },

  // Bogor
  { id: '120301', name: 'Bogor', cityId: '1204', code: 'BGR' },
  { id: '120302', name: 'Bogor Utara', cityId: '1204', code: 'BGU' },
  { id: '120303', name: 'Bogor Selatan', cityId: '1204', code: 'BGS' },
  { id: '120304', name: 'Bogor Timur', cityId: '1204', code: 'BGT' },
  { id: '120305', name: 'Bogor Barat', cityId: '1204', code: 'BGB' },

  // Surabaya
  { id: '130101', name: 'Surabaya', cityId: '1301', code: 'SBY' },
  { id: '130102', name: 'Tegalsari', cityId: '1301', code: 'TGS' },
  { id: '130103', name: 'Bubutan', cityId: '1301', code: 'BBT' },
  { id: '130104', name: 'Genteng', cityId: '1301', code: 'GTG' },
  { id: '130105', name: 'Pabean Cantian', cityId: '1301', code: 'PBC' },

  // Malang
  { id: '130201', name: 'Malang', cityId: '1302', code: 'MLG' },
  { id: '130202', name: 'Kedungkandang', cityId: '1302', code: 'KDK' },
  { id: '130203', name: 'Sukun', cityId: '1302', code: 'SKN' },
  { id: '130204', name: 'Klojen', cityId: '1302', code: 'KLJ' },

  // Jakarta Pusat
  { id: '140101', name: 'Menteng', cityId: '1401', code: 'MTG' },
  { id: '140102', name: 'Cempaka Putih', cityId: '1401', code: 'CPP' },
  { id: '140103', name: 'Senen', cityId: '1401', code: 'SNE' },
  { id: '140104', name: 'Tanah Abang', cityId: '1401', code: 'TAB' },

  // Denpasar
  { id: '150101', name: 'Denpasar Selatan', cityId: '1501', code: 'DNS' },
  { id: '150102', name: 'Denpasar Timur', cityId: '1501', code: 'DNT' },
  { id: '150103', name: 'Denpasar Utara', cityId: '1501', code: 'DNU' },
  { id: '150104', name: 'Denpasar Barat', cityId: '1501', code: 'DNB' },
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<District[] | { error: string }>
) {
  if (req.method === 'GET') {
    const { cityId } = req.query;

    if (!cityId) {
      return res.status(200).json(districts);
    }

    const filtered = districts.filter((district) => district.cityId === cityId);
    return res.status(200).json(filtered);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
