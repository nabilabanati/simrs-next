-- Fix: Remove updated_at from pick_patient_for_ttv function
-- The visits table doesn't have an updated_at column

CREATE OR REPLACE FUNCTION pick_patient_for_ttv(visit_id_input uuid, nurse_id_input uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  updated_row visits%ROWTYPE;
BEGIN
  -- Coba update HANYA JIKA status masih 'belum'
  UPDATE public.visits
  SET 
    ttv_status = 'sedang_dikerjakan'
    -- Removed: updated_at = now() (column doesn't exist)
  WHERE id = visit_id_input AND ttv_status = 'belum'
  RETURNING * INTO updated_row;

  IF updated_row.id IS NOT NULL THEN
    -- Jika berhasil di-lock
    RETURN json_build_object('success', true, 'message', 'Pasien berhasil diambil.');
  ELSE
    -- Jika gagal (berarti sudah diambil nurse lain sedetik sebelumnya)
    RETURN json_build_object('success', false, 'message', 'Maaf, pasien sedang dikerjakan perawat lain.');
  END IF;
END;
$$;
