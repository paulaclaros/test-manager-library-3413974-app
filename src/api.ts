import { AuthResponse, Book, Category, Member, Loan, OverdueItem, ReportRow, ApiError } from './types';

const API_BASE = '/api/v1';

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginApi(username: string, password: string):Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err: ApiError = await res.json().catch(() => ({ code: 'ERROR', message: 'Credenciales inválidas.' }));
    throw err;
  }
  return res.json();
}

export async function getCategoriesApi(token: string): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`, { headers: getHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getBooksApi(token: string, q = '', categoryId = ''): Promise<{ items: Book[]; total: number }> {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (categoryId) params.set('category_id', categoryId);
  const res = await fetch(`${API_BASE}/books?${params.toString()}`, { headers: getHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function createBookApi(token: string, data: { title: string; author: string; isbn: string; category_id: string; total_copies: number }): Promise<Book> {
  const res = await fetch(`${API_BASE}/books`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function updateBookApi(token: string, id: string, data: { title: string; author: string; category_id: string; total_copies: number }): Promise<Book> {
  const res = await fetch(`${API_BASE}/books/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function deleteBookApi(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/books/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
}

export async function getMembersApi(token: string, q = ''): Promise<{ items: Member[]; total: number }> {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  const res = await fetch(`${API_BASE}/members?${params.toString()}`, { headers: getHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function createMemberApi(token: string, data: { full_name: string; document_number: string }): Promise<Member> {
  const res = await fetch(`${API_BASE}/members`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getLoansApi(token: string, status = ''): Promise<{ items: Loan[]; total: number }> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const res = await fetch(`${API_BASE}/loans?${params.toString()}`, { headers: getHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function createLoanApi(token: string, memberId: string, bookIds: string[]): Promise<Loan> {
  const res = await fetch(`${API_BASE}/loans`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({
      member_id: memberId,
      items: bookIds.map((id) => ({ book_id: id })),
    }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function returnLoanItemApi(token: string, loanId: string, itemId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/loans/${loanId}/items/${itemId}/return`, {
    method: 'POST',
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
}

export async function getOverdueLoansApi(token: string): Promise<{ items: OverdueItem[] }> {
  const res = await fetch(`${API_BASE}/loans/overdue`, { headers: getHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getMostBorrowedReportApi(token: string, from: string, to: string): Promise<{ from: string; to: string; rows: ReportRow[] }> {
  const res = await fetch(`${API_BASE}/reports/most-borrowed?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function registerUserApi(token: string, data: { username: string; password: string; role: 'librarian' }): Promise<void> {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
}

export async function uploadCoverApi(token: string, bookId: string, file: File): Promise<Book> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('_method', 'PUT');
  const res = await fetch(`${API_BASE}/books/${bookId}/cover`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    body: formData,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function deleteCoverApi(token: string, bookId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/books/${bookId}/cover`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
}

export async function getUsersApi(token: string): Promise<{ items: UserItem[]; total: number }> {
  const res = await fetch(`${API_BASE}/users`, { headers: getHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function toggleUserStatusApi(token: string, id: string): Promise<UserItem> {
  const res = await fetch(`${API_BASE}/users/${id}/toggle-status`, {
    method: 'PATCH',
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function deleteUserApi(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!res.ok) throw await res.json();
}
