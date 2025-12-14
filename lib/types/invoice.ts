export interface Invoice {
  id: string;
  visit_id: string | null;
  total: number;
  paid: boolean;
  paid_at?: string;
}
