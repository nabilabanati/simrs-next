# Analisis & Optimasi Performa Modal Add Visit

## 🔍 Masalah yang Ditemukan

User melaporkan loading modal agak lambat. Setelah analisis, ditemukan beberapa bottleneck:

### ❌ SEBELUM Optimasi (Sequential Queries)

```typescript
// Step 1: Fetch poli & penjamin (parallel) ✅
const [polisData, paymentsData] = await Promise.all([
  fetchPoli(),
  fetchPenjamin(),
]);

// Step 2: Fetch quota (non-blocking) ✅
fetchQuotaData();

// Step 3: Count visits (sequential) ❌
if (patient.id) {
  const { count } = await supabase
    .from('visits')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', patient.id);
}

// Step 4: Fetch patient penjamin (sequential) ❌
if (patient.id) {
  const { data } = await supabase
    .from('patient_penjamin')
    .select('penjamin_id, penjamin(nama)')
    .eq('patient_id', patient.id)
    .single();
}
```

**Total Time**: Time(Step1) + Time(Step3) + Time(Step4)
- Jika setiap query 200ms → **600ms total**

---

## ✅ SESUDAH Optimasi (Parallel Queries)

```typescript
// ALL queries run in parallel!
const [polisData, paymentsData, visitCountResult, penjaminResult] = await Promise.all([
  fetchPoli(),                    // Query 1
  fetchPenjamin(),                // Query 2
  patient.id                      // Query 3
    ? supabase.from('visits').select('*', { count: 'exact', head: true }).eq('patient_id', patient.id)
    : Promise.resolve({ count: 0, error: null }),
  patient.id                      // Query 4
    ? supabase.from('patient_penjamin').select('penjamin_id, penjamin(nama)').eq('patient_id', patient.id).single()
    : Promise.resolve({ data: null, error: null })
]);

// Process results (instant, no await)
setPolis(polisData);
setPaymentMethods(paymentsData);
setVisitCount(visitCountResult.count + 1);
setSelectedPayment(matchedPayment);

// Fetch quota (non-blocking)
fetchQuotaData();
```

**Total Time**: max(Time(Query1), Time(Query2), Time(Query3), Time(Query4))
- Jika setiap query 200ms → **200ms total** (fastest query wins!)

---

## 📊 Peningkatan Performa

| Metric | Sebelum | Sesudah | Improvement |
|--------|---------|---------|-------------|
| **Total Queries** | 4 sequential | 4 parallel | - |
| **Estimated Time** | ~600ms | ~200ms | **66% faster** |
| **User Experience** | Terasa lambat | Lebih responsif | ✅ |

---

## 🚀 Optimasi Lainnya

### 1. **API Doctors - Join dengan Users**
**File**: `pages/api/master/doctors.ts`

**Sebelum**:
```typescript
.select("id, user_id, spesialis, sip, created_at")
// Nama dokter tidak ada
```

**Sesudah**:
```typescript
.select("id, user_id, spesialis, sip, created_at, users(nama)")
// Join dengan users untuk ambil nama
```

**Impact**: Nama dokter langsung tersedia, tidak perlu query tambahan

### 2. **Filter Payment Methods di Client**
**File**: `components/modals/add-visit-modal.tsx`

```typescript
paymentMethods.filter((pm) => {
  const name = (pm.nama || pm.name || '').toUpperCase().trim();
  return name === 'BPJS' || name === 'UMUM' || name === 'ASURANSI';
})
```

**Impact**: Hanya 3 pilihan ditampilkan, dropdown lebih cepat render

---

## 🎯 Best Practices yang Diterapkan

1. ✅ **Parallel Queries** - Gunakan `Promise.all()` untuk queries yang tidak saling bergantung
2. ✅ **Non-blocking Operations** - `fetchQuotaData()` tidak di-await karena tidak critical
3. ✅ **Conditional Queries** - Hanya fetch jika `patient.id` ada
4. ✅ **Fallback Values** - `Promise.resolve()` untuk prevent errors
5. ✅ **Database Joins** - Join di database level, bukan di client

---

## 📈 Monitoring Performa

### Cara Mengukur:

1. Buka **DevTools** (F12)
2. Tab **Network**
3. Clear network log
4. Buka modal "Tambah Pendaftaran"
5. Lihat waktu loading untuk:
   - `/api/master/poli`
   - `/api/master/penjamin`
   - Supabase queries

### Target Performa:

- ✅ **Modal muncul**: < 100ms
- ✅ **Data loaded**: < 300ms
- ✅ **Total ready**: < 500ms

---

## 🔧 Troubleshooting

### Jika Masih Lambat:

1. **Check Database**:
   - Apakah ada index di `visits.patient_id`?
   - Apakah ada index di `patient_penjamin.patient_id`?

2. **Check Network**:
   - Ping ke Supabase server
   - Bandwidth internet

3. **Check Data Volume**:
   - Berapa banyak data poli?
   - Berapa banyak data penjamin?

### SQL untuk Add Index:

```sql
-- Add index untuk performa lebih baik
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_penjamin_patient_id ON patient_penjamin(patient_id);
```

---

**Tanggal**: 2026-01-06
**Optimasi**: Parallel Queries
**Improvement**: ~66% faster loading
