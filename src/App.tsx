import React, { useState, useEffect } from 'react';
import {
  Book,
  Category,
  Member,
  Loan,
  OverdueItem,
  ReportRow,
  Role,
} from './types';
import * as api from './api';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<Role | null>((localStorage.getItem('role') as Role) || null);
  const [activeTab, setActiveTab] = useState<'loans' | 'books' | 'members' | 'overdue' | 'reports' | 'users'>('loans');

  // Login form
  const [loginUser, setLoginUser] = useState('admin');
  const [loginPass, setLoginPass] = useState('Admin123*');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [overdueItems, setOverdueItems] = useState<OverdueItem[]>([]);
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [reportFrom, setReportFrom] = useState('2026-10-01');
  const [reportTo, setReportTo] = useState('2026-10-31');

  // Filters & Search
  const [bookQuery, setBookQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [loanStatusFilter, setLoanStatusFilter] = useState('');

  // Modals / Actions
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanMemberId, setLoanMemberId] = useState('');
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  const [showBookModal, setShowBookModal] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookIsbn, setBookIsbn] = useState('');
  const [bookCatId, setBookCatId] = useState('');
  const [bookCopies, setBookCopies] = useState(3);
  const [bookCoverFile, setBookCoverFile] = useState<File | null>(null);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberDoc, setNewMemberDoc] = useState('');

  const [newLibUser, setNewLibUser] = useState('');
  const [newLibPass, setNewLibPass] = useState('');

  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  function notify(text: string, type: 'success' | 'error' = 'success') {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 4000);
  }

  // Handle Login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const res = await api.loginApi(loginUser, loginPass);
      setToken(res.access_token);
      setRole(res.role);
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('role', res.role);
      notify(`Bienvenido(a), sesión iniciada como ${res.role}.`);
    } catch (err: any) {
      setLoginError(err.message || 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setToken(null);
    setRole(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  }

  // Load Initial Data
  useEffect(() => {
    if (!token) return;
    loadAll();
  }, [token]);

  async function loadAll() {
    if (!token) return;
    try {
      const [cats, bks, mems, lns, ovd] = await Promise.all([
        api.getCategoriesApi(token).catch(() => [
          { id: '11111111-1111-4111-8111-111111111111', name: 'Novela' },
          { id: '22222222-2222-4222-8222-222222222222', name: 'Ciencia' },
          { id: '33333333-3333-4333-8333-333333333333', name: 'Tecnología' },
          { id: '44444444-4444-4444-8444-444444444444', name: 'Historia' },
          { id: '55555555-5555-4555-8555-555555555555', name: 'Infantil' },
        ]),
        api.getBooksApi(token, bookQuery, selectedCat).then((r) => r.items).catch(() => []),
        api.getMembersApi(token, memberQuery).then((r) => r.items).catch(() => []),
        api.getLoansApi(token, loanStatusFilter).then((r) => r.items).catch(() => []),
        api.getOverdueLoansApi(token).then((r) => r.items).catch(() => []),
      ]);
      setCategories(cats);
      setBooks(bks);
      setMembers(mems);
      setLoans(lns);
      setOverdueItems(ovd);
    } catch (e) {
      console.error(e);
    }
  }

  // Create Loan
  async function handleCreateLoan(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!loanMemberId) return notify('Seleccione un socio', 'error');
    if (selectedBookIds.length === 0 || selectedBookIds.length > 3) {
      return notify('Debe seleccionar entre 1 y 3 libros', 'error');
    }

    try {
      await api.createLoanApi(token, loanMemberId, selectedBookIds);
      notify('Préstamo registrado exitosamente.');
      setShowLoanModal(false);
      setLoanMemberId('');
      setSelectedBookIds([]);
      loadAll();
    } catch (err: any) {
      notify(err.message || 'Error al registrar el préstamo', 'error');
    }
  }

  // Return Item
  async function handleReturnItem(loanId: string, itemId: string) {
    if (!token) return;
    try {
      await api.returnLoanItemApi(token, loanId, itemId);
      notify('Libro devuelto con éxito. Ejemplar reincorporado al stock.');
      loadAll();
    } catch (err: any) {
      notify(err.message || 'Error al devolver el libro', 'error');
    }
  }

  // Create Book
  async function handleCreateBook(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      const createdBook = await api.createBookApi(token, {
        title: bookTitle,
        author: bookAuthor,
        isbn: bookIsbn,
        category_id: bookCatId || categories[0]?.id || '',
        total_copies: Number(bookCopies),
      });

      if (bookCoverFile && createdBook?.id) {
        await api.uploadCoverApi(token, createdBook.id, bookCoverFile);
      }

      notify('Libro y portada registrados exitosamente en el catálogo.');
      setShowBookModal(false);
      setBookTitle('');
      setBookAuthor('');
      setBookIsbn('');
      setBookCoverFile(null);
      loadAll();
    } catch (err: any) {
      notify(err.message || 'Error al crear libro', 'error');
    }
  }

  // Delete Book
  async function handleDeleteBook(id: string) {
    if (!token || !confirm('¿Dar de baja este libro del catálogo?')) return;
    try {
      await api.deleteBookApi(token, id);
      notify('Libro dado de baja correctamente.');
      loadAll();
    } catch (err: any) {
      notify(err.message || 'No se puede dar de baja (posible préstamo abierto)', 'error');
    }
  }

  // Upload Book Cover
  async function handleUploadCover(bookId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    try {
      await api.uploadCoverApi(token, bookId, file);
      notify('Portada actualizada exitosamente.');
      loadAll();
    } catch (err: any) {
      notify(err.message || 'Error al subir la portada', 'error');
    }
  }

  // Delete Book Cover
  async function handleDeleteCover(bookId: string) {
    if (!token || !confirm('¿Eliminar la portada de este libro?')) return;
    try {
      await api.deleteCoverApi(token, bookId);
      notify('Portada eliminada correctamente.');
      loadAll();
    } catch (err: any) {
      notify(err.message || 'Error al eliminar la portada', 'error');
    }
  }

  // Create Member
  async function handleCreateMember(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      await api.createMemberApi(token, {
        full_name: newMemberName,
        document_number: newMemberDoc,
      });
      notify('Socio registrado con éxito.');
      setShowMemberModal(false);
      setNewMemberName('');
      setNewMemberDoc('');
      loadAll();
    } catch (err: any) {
      notify(err.message || 'Error al registrar socio', 'error');
    }
  }

  // Generate Report
  async function handleGenerateReport() {
    if (!token) return;
    try {
      const res = await api.getMostBorrowedReportApi(token, reportFrom, reportTo);
      setReportRows(res.rows);
      notify(`Reporte generado: ${res.rows.length} libros prestados en el periodo.`);
    } catch (err: any) {
      notify(err.message || 'Error al generar reporte', 'error');
    }
  }

  // Register Librarian
  async function handleRegisterLibrarian(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      await api.registerUserApi(token, {
        username: newLibUser,
        password: newLibPass,
        role: 'librarian',
      });
      notify(`Bibliotecario «${newLibUser}» creado exitosamente.`);
      setNewLibUser('');
      setNewLibPass('');
    } catch (err: any) {
      notify(err.message || 'Error al crear bibliotecario', 'error');
    }
  }

  // If not logged in -> Show Login View
  if (!token) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <span className="logo-icon">📚</span>
            <h1>Manager Library</h1>
            <p>Sistema de Gestión de Préstamos y Catálogo · SENA ADSO</p>
          </div>
          {loginError && <div className="alert-error">{loginError}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Usuario</label>
              <input
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="admin"
                required
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="********"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </form>
          <div className="login-footer">
            <p>Credenciales de evaluación:</p>
            <code>Usuario: admin | Clave: Admin123*</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Navbar */}
      <header className="app-header">
        <div className="header-brand">
          <span className="logo-icon">📚</span>
          <div>
            <h2>Manager Library</h2>
            <small>Ficha 3413974 · Clean Architecture</small>
          </div>
        </div>

        <nav className="header-nav">
          <button
            className={activeTab === 'loans' ? 'active' : ''}
            onClick={() => setActiveTab('loans')}
          >
            📋 Préstamos
          </button>
          <button
            className={activeTab === 'books' ? 'active' : ''}
            onClick={() => setActiveTab('books')}
          >
            📖 Catálogo
          </button>
          <button
            className={activeTab === 'members' ? 'active' : ''}
            onClick={() => setActiveTab('members')}
          >
            👥 Socios
          </button>
          <button
            className={activeTab === 'overdue' ? 'active' : ''}
            onClick={() => setActiveTab('overdue')}
          >
            ⚠️ Vencidos
          </button>
          {role === 'admin' && (
            <>
              <button
                className={activeTab === 'reports' ? 'active' : ''}
                onClick={() => {
                  setActiveTab('reports');
                  handleGenerateReport();
                }}
              >
                📊 Reportes
              </button>
              <button
                className={activeTab === 'users' ? 'active' : ''}
                onClick={() => setActiveTab('users')}
              >
                👤 Usuarios
              </button>
            </>
          )}
        </nav>

        <div className="header-user">
          <span className={`badge-role ${role}`}>{role?.toUpperCase()}</span>
          <button className="btn-logout" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Notifications */}
      {alertMsg && (
        <div className={`toast-alert ${alertMsg.type}`}>
          {alertMsg.type === 'success' ? '✅' : '❌'} {alertMsg.text}
        </div>
      )}

      {/* Main Content */}
      <main className="app-main">
        {/* TAB: LOANS */}
        {activeTab === 'loans' && (
          <section className="card-panel">
            <div className="panel-header">
              <div>
                <h3>Gestión de Préstamos y Devoluciones</h3>
                <p>Registro atómico de 1 a 3 libros (14 días de plazo) y devolución por línea.</p>
              </div>
              <button className="btn-primary" onClick={() => setShowLoanModal(true)}>
                + Nuevo Préstamo
              </button>
            </div>

            {/* Filter */}
            <div className="filters-bar">
              <label>Filtrar por estado:</label>
              <select
                value={loanStatusFilter}
                onChange={(e) => {
                  setLoanStatusFilter(e.target.value);
                  api.getLoansApi(token, e.target.value).then((r) => setLoans(r.items));
                }}
              >
                <option value="">Todos los préstamos</option>
                <option value="open">Abiertos (Open)</option>
                <option value="overdue">Vencidos (Overdue)</option>
                <option value="closed">Cerrados (Closed)</option>
              </select>
            </div>

            {loans.length === 0 ? (
              <p className="empty-state">No hay préstamos registrados aún.</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID Préstamo</th>
                      <th>Fecha Préstamo (UTC)</th>
                      <th>Estado</th>
                      <th>Líneas (Libros prestados)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((ln) => (
                      <tr key={ln.id}>
                        <td>
                          <code
                            className="uuid-badge"
                            title="Haz clic para copiar el ID completo"
                            onClick={() => {
                              navigator.clipboard.writeText(ln.id);
                              notify('ID copiado al portapapeles');
                            }}
                          >
                            {ln.id}
                          </code>
                        </td>
                        <td>{new Date(ln.loaned_at).toLocaleString()}</td>
                        <td>
                          <span className={`status-badge status-${ln.status}`}>
                            {ln.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <ul className="loan-items-list">
                            {ln.items.map((item) => (
                              <li key={item.id} className="loan-item-row">
                                <div>
                                  <strong>{item.book_title}</strong> (ISBN: {item.isbn} | {item.category_name})
                                  <br />
                                  <small>
                                    Vence: {new Date(item.due_at).toLocaleDateString()}
                                    {item.returned_at ? (
                                      <span className="text-success">
                                        {' '}
                                        · Devuelto el {new Date(item.returned_at).toLocaleDateString()}
                                      </span>
                                    ) : (
                                      <span className="text-warning"> · Pendiente</span>
                                    )}
                                  </small>
                                </div>
                                {!item.returned_at && (
                                  <button
                                    className="btn-sm btn-outline"
                                    onClick={() => handleReturnItem(ln.id, item.id)}
                                  >
                                    Devolver Libro
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* TAB: BOOKS */}
        {activeTab === 'books' && (
          <section className="card-panel">
            <div className="panel-header">
              <div>
                <h3>Catálogo de Libros</h3>
                <p>Libros registrados con copias disponibles y totales.</p>
              </div>
              {role === 'admin' && (
                <button className="btn-primary" onClick={() => setShowBookModal(true)}>
                  + Registrar Libro
                </button>
              )}
            </div>

            <div className="filters-bar">
              <input
                type="text"
                placeholder="Buscar por título o autor..."
                value={bookQuery}
                onChange={(e) => setBookQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadAll()}
              />
              <select
                value={selectedCat}
                onChange={(e) => {
                  setSelectedCat(e.target.value);
                  api.getBooksApi(token, bookQuery, e.target.value).then((r) => setBooks(r.items));
                }}
              >
                <option value="">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button className="btn-secondary" onClick={loadAll}>
                Buscar
              </button>
              {role === 'admin' && (
                <button
                  className="btn-primary"
                  style={{ width: 'auto', marginLeft: 'auto' }}
                  onClick={() => setShowBookModal(true)}
                >
                  + Registrar Libro
                </button>
              )}
            </div>

            <div className="books-grid">
              {books.map((b) => (
                <div key={b.id} className="book-card">
                  <div className="book-cover">
                    {b.cover_key ? (
                      <img src={`/api/v1/books/${b.id}/cover`} alt={b.title} />
                    ) : (
                      <div className="cover-placeholder">📖</div>
                    )}
                  </div>
                  <div className="book-info">
                    <h4>{b.title}</h4>
                    <p className="book-author">Por: {b.author}</p>
                    <p className="book-meta">
                      <span>ISBN: {b.isbn}</span>
                      <span className="badge-cat">{b.category?.name || 'General'}</span>
                    </p>
                    <div className="stock-info">
                      <span
                        className={`stock-badge ${
                          b.available_copies > 0 ? 'in-stock' : 'out-of-stock'
                        }`}
                      >
                        {b.available_copies} de {b.total_copies} disponibles
                      </span>
                    </div>
                    {role === 'admin' && (
                      <div className="card-actions">
                        <label className="btn-sm btn-outline" style={{ cursor: 'pointer', textAlign: 'center' }}>
                          📷 Portada
                          <input
                            type="file"
                            accept="image/jpeg,image/png"
                            style={{ display: 'none' }}
                            onChange={(e) => handleUploadCover(b.id, e)}
                          />
                        </label>
                        {b.cover_key && (
                          <button
                            className="btn-sm btn-outline"
                            title="Quitar portada"
                            onClick={() => handleDeleteCover(b.id)}
                          >
                            🗑️
                          </button>
                        )}
                        <button
                          className="btn-danger-sm"
                          onClick={() => handleDeleteBook(b.id)}
                        >
                          Dar de Baja
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB: MEMBERS */}
        {activeTab === 'members' && (
          <section className="card-panel">
            <div className="panel-header">
              <div>
                <h3>Directorio de Socios</h3>
                <p>Gestión de personas habilitadas para préstamos.</p>
              </div>
              <button className="btn-primary" onClick={() => setShowMemberModal(true)}>
                + Nuevo Socio
              </button>
            </div>

            <div className="filters-bar">
              <input
                type="text"
                placeholder="Buscar por nombre o documento..."
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadAll()}
              />
              <button className="btn-secondary" onClick={loadAll}>
                Buscar
              </button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Nombre Completo</th>
                  <th>Préstamos Activos</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.document_number}</strong>
                    </td>
                    <td>{m.full_name}</td>
                    <td>
                      <span className="badge-count">{m.active_loans ?? 0} libro(s)</span>
                    </td>
                    <td>
                      {(m.active_loans ?? 0) >= 3 ? (
                        <span className="text-danger">⚠️ Límite máximo (3)</span>
                      ) : (
                        <span className="text-success">✅ Habilitado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* TAB: OVERDUE */}
        {activeTab === 'overdue' && (
          <section className="card-panel">
            <div className="panel-header">
              <div>
                <h3>🚨 Libros Vencidos (Overdue)</h3>
                <p>Líneas con fecha límite anterior al momento actual, ordenadas por días de retraso.</p>
              </div>
              <button className="btn-secondary" onClick={loadAll}>
                Actualizar
              </button>
            </div>

            {overdueItems.length === 0 ? (
              <div className="empty-state text-success">
                🎉 No hay ningún libro vencido pendiente por devolución.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Días de Retraso</th>
                    <th>Libro</th>
                    <th>Socio</th>
                    <th>Fecha de Vencimiento</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueItems.map((item) => (
                    <tr key={item.item_id}>
                      <td>
                        <span className="badge-danger">
                          +{item.days_late} día(s) tarde
                        </span>
                      </td>
                      <td>
                        <strong>{item.book_title}</strong>
                      </td>
                      <td>{item.member_name}</td>
                      <td>{new Date(item.due_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn-sm btn-primary"
                          onClick={() => handleReturnItem(item.loan_id, item.item_id)}
                        >
                          Devolver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* TAB: REPORTS */}
        {activeTab === 'reports' && role === 'admin' && (
          <section className="card-panel">
            <div className="panel-header">
              <div>
                <h3>📊 Reporte: Libros Más Prestados (ADR-004)</h3>
                <p>Agrupación histórica congelada por libro y categoría en el rango de fechas.</p>
              </div>
            </div>

            <div className="filters-bar">
              <label>Desde:</label>
              <input
                type="date"
                value={reportFrom}
                onChange={(e) => setReportFrom(e.target.value)}
              />
              <label>Hasta:</label>
              <input
                type="date"
                value={reportTo}
                onChange={(e) => setReportTo(e.target.value)}
              />
              <button className="btn-primary" onClick={handleGenerateReport}>
                Generar Reporte
              </button>
            </div>

            {reportRows.length === 0 ? (
              <p className="empty-state">No se registraron préstamos en este rango de fechas.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ranking</th>
                    <th>Título del Libro</th>
                    <th>Categoría</th>
                    <th>Veces Prestado</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row, idx) => (
                    <tr key={row.book_id}>
                      <td>
                        <strong>#{idx + 1}</strong>
                      </td>
                      <td>{row.book_title}</td>
                      <td>
                        <span className="badge-cat">{row.category_name}</span>
                      </td>
                      <td>
                        <span className="badge-count-success">
                          {row.times_borrowed} préstamo(s)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* TAB: USERS */}
        {activeTab === 'users' && role === 'admin' && (
          <section className="card-panel">
            <div className="panel-header">
              <div>
                <h3>👤 Gestión de Usuarios Internos</h3>
                <p>Creación de cuentas para personal bibliotecario (HU-02).</p>
              </div>
            </div>

            <form onSubmit={handleRegisterLibrarian} className="form-grid">
              <div className="form-group">
                <label>Nombre de Usuario</label>
                <input
                  type="text"
                  placeholder="ej. carlos"
                  value={newLibUser}
                  onChange={(e) => setNewLibUser(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newLibPass}
                  onChange={(e) => setNewLibPass(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Rol Asignado</label>
                <input type="text" value="librarian" disabled />
              </div>
              <div className="form-group align-end">
                <button type="submit" className="btn-primary">
                  Crear Bibliotecario
                </button>
              </div>
            </form>
          </section>
        )}
      </main>

      {/* MODAL: REGISTRAR PRÉSTAMO */}
      {showLoanModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Registrar Nuevo Préstamo</h3>
            <form onSubmit={handleCreateLoan}>
              <div className="form-group">
                <label>Seleccionar Socio</label>
                <select
                  value={loanMemberId}
                  onChange={(e) => setLoanMemberId(e.target.value)}
                  required
                >
                  <option value="">-- Seleccione un socio --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.document_number}) — {m.active_loans ?? 0} activos
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  Seleccionar Libros (1 a 3 libros) · Seleccionados: {selectedBookIds.length}/3
                </label>
                <div className="books-select-list">
                  {books
                    .filter((b) => b.available_copies > 0)
                    .map((b) => {
                      const isSelected = selectedBookIds.includes(b.id);
                      return (
                        <div
                          key={b.id}
                          className={`book-select-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedBookIds(selectedBookIds.filter((id) => id !== b.id));
                            } else if (selectedBookIds.length < 3) {
                              setSelectedBookIds([...selectedBookIds, b.id]);
                            } else {
                              notify('Máximo 3 libros por préstamo', 'error');
                            }
                          }}
                        >
                          <input type="checkbox" checked={isSelected} readOnly />
                          <span>
                            <strong>{b.title}</strong> ({b.author}) · Disp: {b.available_copies}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowLoanModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Confirmar Préstamo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR LIBRO */}
      {showBookModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Registrar Nuevo Libro en el Catálogo</h3>
            <form onSubmit={handleCreateBook}>
              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="ej. El Principito"
                  required
                />
              </div>
              <div className="form-group">
                <label>Autor</label>
                <input
                  type="text"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  placeholder="ej. Antoine de Saint-Exupéry"
                  required
                />
              </div>
              <div className="form-group">
                <label>ISBN (13 dígitos numéricos)</label>
                <input
                  type="text"
                  value={bookIsbn}
                  onChange={(e) => setBookIsbn(e.target.value)}
                  placeholder="9780156012195"
                  maxLength={13}
                  required
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select
                  value={bookCatId}
                  onChange={(e) => setBookCatId(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar categoría --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Total de Ejemplares (Stock ≥ 1)</label>
                <input
                  type="number"
                  min={1}
                  value={bookCopies}
                  onChange={(e) => setBookCopies(Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label>📷 Imagen de Portada (JPG o PNG, opcional)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setBookCoverFile(e.target.files?.[0] || null)}
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                  Puedes cargar la imagen de portada directamente aquí o cambiarla luego en el catálogo.
                </small>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowBookModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Libro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR SOCIO */}
      {showMemberModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Registrar Nuevo Socio</h3>
            <form onSubmit={handleCreateMember}>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="ej. Carlos Mendoza"
                  required
                />
              </div>
              <div className="form-group">
                <label>Número de Documento (Único)</label>
                <input
                  type="text"
                  value={newMemberDoc}
                  onChange={(e) => setNewMemberDoc(e.target.value)}
                  placeholder="ej. 10203040"
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowMemberModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Registrar Socio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
