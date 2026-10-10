export type Role = 'admin' | 'librarian';

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  role: Role;
}

export interface Category {
  id: string;
  name: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: Category;
  total_copies: number;
  available_copies: number;
  cover_key: string | null;
}

export interface Member {
  id: string;
  full_name: string;
  document_number: string;
  active_loans?: number;
}

export type LoanStatus = 'open' | 'overdue' | 'closed';

export interface LoanItem {
  id: string;
  book_id: string;
  book_title: string;
  isbn: string;
  category_name: string;
  due_at: string;
  returned_at: string | null;
}

export interface Loan {
  id: string;
  member_id: string;
  loaned_at: string;
  status: LoanStatus;
  items: LoanItem[];
}

export interface OverdueItem {
  loan_id: string;
  item_id: string;
  book_title: string;
  member_name: string;
  due_at: string;
  days_late: number;
}

export interface ReportRow {
  book_id: string;
  book_title: string;
  category_name: string;
  times_borrowed: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field: string; issue: string }>;
}
