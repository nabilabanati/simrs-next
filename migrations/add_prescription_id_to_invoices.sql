-- Migration: Add prescription_id to invoices table
-- Date: 2025-12-18
-- Description: Link invoices directly to prescriptions for better tracking

-- 1. Add prescription_id column to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE SET NULL;

-- 2. Update existing invoices to link with prescriptions (if any exist)
UPDATE public.invoices i
SET prescription_id = p.id
FROM public.prescriptions p
WHERE p.visit_id = i.visit_id
AND i.prescription_id IS NULL;

-- 3. Drop and recreate the trigger function with prescription_id support
DROP TRIGGER IF EXISTS after_visit_finished ON public.visits;
DROP FUNCTION IF EXISTS generate_invoice_on_finish();

CREATE OR REPLACE FUNCTION generate_invoice_on_finish()
RETURNS trigger AS $$
DECLARE
  biaya_poli numeric;
  biaya_obat numeric;
  resep_id uuid;
BEGIN
  -- Trigger jalan jika status visit berubah jadi 'selesai'
  IF NEW.status = 'selesai' AND OLD.status != 'selesai' THEN
    
    -- 1. Ambil harga poli
    SELECT harga_daftar INTO biaya_poli FROM public.poli WHERE id = NEW.poli_id;

    -- 2. Ambil prescription_id dan hitung total obat dari resep terkait visit ini
    SELECT p.id, COALESCE(SUM(m.harga * pi.qty), 0) 
    INTO resep_id, biaya_obat
    FROM public.prescriptions p
    LEFT JOIN public.prescription_items pi ON pi.prescription_id = p.id
    LEFT JOIN public.medicines m ON m.id = pi.medicine_id
    WHERE p.visit_id = NEW.id
    GROUP BY p.id
    LIMIT 1;

    -- 3. Insert ke Invoices (dengan prescription_id)
    INSERT INTO public.invoices (visit_id, prescription_id, total, paid)
    VALUES (NEW.id, resep_id, (biaya_poli + COALESCE(biaya_obat, 0)), false);
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recreate the trigger
CREATE TRIGGER after_visit_finished
AFTER UPDATE ON public.visits
FOR EACH ROW
EXECUTE FUNCTION generate_invoice_on_finish();

-- Verification query
-- Run this to check if migration was successful:
-- SELECT i.id, i.visit_id, i.prescription_id, i.total, v.no_reg, p.no_order
-- FROM invoices i
-- LEFT JOIN visits v ON i.visit_id = v.id
-- LEFT JOIN prescriptions p ON i.prescription_id = p.id
-- ORDER BY i.created_at DESC
-- LIMIT 10;
