import type { NextApiRequest, NextApiResponse } from 'next';

export interface Village {
  id: string;
  name: string;
  districtId: string;
  code: string;
}

const villages: Village[] = [
  // Purwokerto Utara
  { id: '11010101', name: 'Purwokerto Utara', districtId: '110101', code: 'PWU01' },
  { id: '11010102', name: 'Karangpucal', districtId: '110101', code: 'KRP' },
  { id: '11010103', name: 'Kranji', districtId: '110101', code: 'KRJ' },
  { id: '11010104', name: 'Dadirejo', districtId: '110101', code: 'DDR' },

  // Purwokerto Selatan
  { id: '11010201', name: 'Purwokerto Selatan', districtId: '110102', code: 'PWS01' },
  { id: '11010202', name: 'Sokanegara', districtId: '110102', code: 'SKN' },
  { id: '11010203', name: 'Karangpucal Barat', districtId: '110102', code: 'KRB' },
  { id: '11010204', name: 'Tanjungsari', districtId: '110102', code: 'TNJ' },

  // Purwokerto Timur
  { id: '11010301', name: 'Purwokerto Timur', districtId: '110103', code: 'PWT01' },
  { id: '11010302', name: 'Jati', districtId: '110103', code: 'JTI' },
  { id: '11010303', name: 'Sumbang', districtId: '110103', code: 'SMB' },

  // Purwokerto Barat
  { id: '11010401', name: 'Purwokerto Barat', districtId: '110104', code: 'PWB01' },
  { id: '11010402', name: 'Grendeng', districtId: '110104', code: 'GRD' },
  { id: '11010403', name: 'Sempor', districtId: '110104', code: 'SMP' },

  // Ajibarang
  { id: '11010501', name: 'Ajibarang', districtId: '110105', code: 'AJB01' },
  { id: '11010502', name: 'Ajibarang Lor', districtId: '110105', code: 'AJBL' },
  { id: '11010503', name: 'Ajibarang Kidul', districtId: '110105', code: 'AJBK' },

  // Jatilawang
  { id: '11010601', name: 'Jatilawang', districtId: '110106', code: 'JTL01' },
  { id: '11010602', name: 'Jatilawang Lor', districtId: '110106', code: 'JTLL' },
  { id: '11010603', name: 'Jatilawang Kidul', districtId: '110106', code: 'JTLK' },

  // Cilacap Selatan
  { id: '11030101', name: 'Cilacap Selatan', districtId: '110301', code: 'CLS01' },
  { id: '11030102', name: 'Sidareja', districtId: '110301', code: 'SJA' },
  { id: '11030103', name: 'Gn. Jati', districtId: '110301', code: 'GNJ' },

  // Cilacap Tengah
  { id: '11030201', name: 'Cilacap Tengah', districtId: '110302', code: 'CLT01' },
  { id: '11030202', name: 'Donan', districtId: '110302', code: 'DNO' },
  { id: '11030203', name: 'Penggalang', districtId: '110302', code: 'PGL' },

  // Cilacap Utara
  { id: '11030301', name: 'Cilacap Utara', districtId: '110303', code: 'CLU01' },
  { id: '11030302', name: 'Kedung Bumen', districtId: '110303', code: 'KDB' },
  { id: '11030303', name: 'Wanareja', districtId: '110303', code: 'WNR' },

  // Maos
  { id: '11030401', name: 'Maos', districtId: '110304', code: 'MOS01' },
  { id: '11030402', name: 'Maos Lor', districtId: '110304', code: 'MOSL' },

  // Kebumen
  { id: '11040101', name: 'Kebumen', districtId: '110401', code: 'KBM01' },
  { id: '11040102', name: 'Kebumen Lor', districtId: '110401', code: 'KBML' },

  // Bandung
  { id: '12010101', name: 'Bandung', districtId: '120101', code: 'BDG01' },
  { id: '12010102', name: 'Andir', districtId: '120101', code: 'AND' },
  { id: '12010103', name: 'Astana Anyar', districtId: '120101', code: 'ASA' },

  // Bogor
  { id: '12030101', name: 'Bogor', districtId: '120301', code: 'BGR01' },
  { id: '12030102', name: 'Bogor Tengah', districtId: '120301', code: 'BGT' },

  // Surabaya
  { id: '13010101', name: 'Surabaya', districtId: '130101', code: 'SBY01' },
  { id: '13010102', name: 'Tegalsari Barat', districtId: '130102', code: 'TGSB' },

  // Malang
  { id: '13020101', name: 'Malang', districtId: '130201', code: 'MLG01' },
  { id: '13020102', name: 'Malang Kidul', districtId: '130201', code: 'MLGK' },

  // Jakarta Pusat
  { id: '14010101', name: 'Menteng', districtId: '140101', code: 'MTG01' },
  { id: '14010102', name: 'Menteng Utara', districtId: '140101', code: 'MTGU' },

  // Denpasar
  { id: '15010101', name: 'Denpasar Selatan', districtId: '150101', code: 'DNS01' },
  { id: '15010102', name: 'Sesetan', districtId: '150101', code: 'SES' },
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Village[] | { error: string }>
) {
  if (req.method === 'GET') {
    const { districtId } = req.query;

    if (!districtId) {
      return res.status(200).json(villages);
    }

    const filtered = villages.filter((village) => village.districtId === districtId);
    return res.status(200).json(filtered);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
