-- Migration: Add referrals table and disposition fields
-- Description: Support patient disposition (discharge, external referral, internal consultation)
-- Date: 2025-12-20

-- =====================================================
-- 1. Create referrals table for tracking rujukan
-- =====================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  from_visit_id uuid NOT NULL,
  to_visit_id uuid,
  referral_type text NOT NULL CHECK (referral_type IN ('internal', 'external')),
  from_poli_id uuid,
  to_poli_id uuid,
  from_doctor_id uuid,
  to_doctor_id uuid,
  external_destination text,
  notes text,
  status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT referrals_pkey PRIMARY KEY (id),
  CONSTRAINT referrals_from_visit_id_fkey FOREIGN KEY (from_visit_id) REFERENCES public.visits(id) ON DELETE CASCADE,
  CONSTRAINT referrals_to_visit_id_fkey FOREIGN KEY (to_visit_id) REFERENCES public.visits(id) ON DELETE SET NULL,
  CONSTRAINT referrals_from_poli_id_fkey FOREIGN KEY (from_poli_id) REFERENCES public.poli(id),
  CONSTRAINT referrals_to_poli_id_fkey FOREIGN KEY (to_poli_id) REFERENCES public.poli(id),
  CONSTRAINT referrals_from_doctor_id_fkey FOREIGN KEY (from_doctor_id) REFERENCES public.doctors(id),
  CONSTRAINT referrals_to_doctor_id_fkey FOREIGN KEY (to_doctor_id) REFERENCES public.doctors(id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_referrals_from_visit ON public.referrals(from_visit_id);
CREATE INDEX IF NOT EXISTS idx_referrals_to_visit ON public.referrals(to_visit_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- =====================================================
-- 2. Add disposition field to medical_records
-- =====================================================
ALTER TABLE public.medical_records
ADD COLUMN IF NOT EXISTS disposition text CHECK (disposition IN ('pulang', 'rujuk_rs', 'konsul_internal'));

COMMENT ON COLUMN public.medical_records.disposition IS 'Patient disposition: pulang (discharge), rujuk_rs (external referral), konsul_internal (internal consultation)';

-- =====================================================
-- 3. Add referral flag to visits
-- =====================================================
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS is_referral boolean DEFAULT false;

COMMENT ON COLUMN public.visits.is_referral IS 'Flag indicating this visit is from internal referral';

-- =====================================================
-- 4. Add referral fee tracking to invoices
-- =====================================================
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS referral_poli_fee numeric DEFAULT 0;

COMMENT ON COLUMN public.invoices.referral_poli_fee IS 'Poli fee from referring visit (for internal referrals)';

-- =====================================================
-- Comments for referrals table
-- =====================================================
COMMENT ON TABLE public.referrals IS 'Tracks patient referrals (internal consultation and external referrals)';
COMMENT ON COLUMN public.referrals.from_visit_id IS 'Visit ID where referral originated';
COMMENT ON COLUMN public.referrals.to_visit_id IS 'Visit ID created for internal referral (NULL for external)';
COMMENT ON COLUMN public.referrals.referral_type IS 'Type: internal (konsul poli lain) or external (rujuk RS lain)';
COMMENT ON COLUMN public.referrals.external_destination IS 'Hospital name for external referrals';
COMMENT ON COLUMN public.referrals.notes IS 'Referral notes from referring doctor';
COMMENT ON COLUMN public.referrals.status IS 'Referral status: pending, completed, cancelled';
