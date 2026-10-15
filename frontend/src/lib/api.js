function obtenerApiUrl() {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  if (window.location.protocol === 'https:') return '';
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  return '';
}

const API_URL = obtenerApiUrl();



async function manejarRespuesta(res) {
  if (!res.ok) {
    if (res.status === 401) {
      api.logout();
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    let mensaje = `Error ${res.status}`;
    try {
      const data = await res.json();
      mensaje = data.message || mensaje;
    } catch {
      // respuesta sin cuerpo JSON
    }
    throw new Error(mensaje);
  }
  return res.json();
}

export const api = {
  // Beneficiarios
  listarBeneficiarios: () =>
    fetch(`${API_URL}/beneficiarios`).then(manejarRespuesta),

  crearBeneficiario: (data) =>
    fetch(`${API_URL}/beneficiarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(manejarRespuesta),

  eliminarBeneficiario: (id) =>
    fetch(`${API_URL}/beneficiarios/${id}`, { method: 'DELETE' }).then(
      manejarRespuesta,
    ),

  urlQr: (id) => `${API_URL}/beneficiarios/${id}/qr`,

  // WhatsApp Real Session
  iniciarSesionWhatsapp: (numeroWhatsapp, beneficiarioId) =>
    fetch(`${API_URL}/whatsapp/iniciar-sesion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numeroWhatsapp, beneficiarioId }),
    }).then(manejarRespuesta),

  iniciarSesionTelegram: (chatId, beneficiarioId) =>
    fetch(`${API_URL}/telegram/iniciar-sesion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, beneficiarioId }),
    }).then(manejarRespuesta),

  iniciarSesionDiscord: (userId, beneficiarioId) =>
    fetch(`${API_URL}/discord/iniciar-sesion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, beneficiarioId }),
    }).then(manejarRespuesta),

  // Entregas
  listarEntregas: () => fetch(`${API_URL}/entregas`).then(manejarRespuesta),

  obtenerEntrega: (id) =>
    fetch(`${API_URL}/entregas/${id}`).then(manejarRespuesta),

  obtenerKpis: () => fetch(`${API_URL}/entregas/kpis`).then(manejarRespuesta),

  obtenerAlertas: () =>
    fetch(`${API_URL}/entregas/alertas`).then(manejarRespuesta),

  simularWhatsapp: (beneficiarioId, archivoFoto) => {
    const formData = new FormData();
    formData.append('beneficiarioId', beneficiarioId);
    formData.append('foto', archivoFoto);
    return fetch(`${API_URL}/entregas/simular-whatsapp`, {
      method: 'POST',
      body: formData,
    }).then(manejarRespuesta);
  },

  urlFoto: (fotoUrl) => (fotoUrl ? `${API_URL}${fotoUrl}` : null),

  // CONTROLES
  listarCategorias: () =>
    fetch(`${API_URL}/controles/categorias`).then(manejarRespuesta),

  crearCategoria: (data) =>
    fetch(`${API_URL}/controles/categorias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(manejarRespuesta),

  listarControles: (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    return fetch(`${API_URL}/controles${params ? `?${params}` : ''}`).then(manejarRespuesta);
  },

  crearControl: (data) =>
    fetch(`${API_URL}/controles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(manejarRespuesta),

  actualizarControl: (id, data) =>
    fetch(`${API_URL}/controles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(manejarRespuesta),

  obtenerControl: (id) =>
    fetch(`${API_URL}/controles/${id}`).then(manejarRespuesta),

  eliminarControl: (id) =>
    fetch(`${API_URL}/controles/${id}`, { method: 'DELETE' }).then(manejarRespuesta),

  importarControles: (data) =>
    fetch(`${API_URL}/controles/importar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(manejarRespuesta),

  descartarControl: (id, data) =>
    fetch(`${API_URL}/controles/${id}/descartar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(manejarRespuesta),

  listarDescartados: () =>
    fetch(`${API_URL}/controles/descartados/lista`).then(manejarRespuesta),

  obtenerInformeDepuracion: () =>
    fetch(`${API_URL}/controles/informe/depuracion`).then(manejarRespuesta),

  obtenerMenuModo: () =>
    fetch(`${API_URL}/controles/modo-menu/estructura`).then(manejarRespuesta),

  buscarControles: (termino) =>
    fetch(`${API_URL}/controles/buscar?termino=${encodeURIComponent(termino)}`).then(manejarRespuesta),

  ejecutarPrueba: (id, data) =>
    fetch(`${API_URL}/controles/${id}/pruebas/ejecutar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(manejarRespuesta),

  aprobarParaProduccion: (id) =>
    fetch(`${API_URL}/controles/${id}/produccion/aprobar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).then(manejarRespuesta),

  listarPruebas: (id) =>
    fetch(`${API_URL}/controles/${id}/pruebas/lista`).then(manejarRespuesta),

  crearDocumentacion: (data) =>
    fetch(`${API_URL}/controles/documentacion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(manejarRespuesta),

  listarDocumentacion: (controlId) => {
    const params = controlId ? `?controlId=${controlId}` : '';
    return fetch(`${API_URL}/controles/documentacion/lista${params}`).then(manejarRespuesta);
  },

  // HARNESS (ARNÉS DE CONTROLES LEAN STARTUP)
  listarHarnessControles: () =>
    fetch(`${API_URL}/harness/controles`, {
      headers: getAuthHeaders(),
    }).then(manejarRespuesta),

  toggleHarnessControl: (id, estado) =>
    fetch(`${API_URL}/harness/controles/${id}/toggle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ estado }),
    }).then(manejarRespuesta),

  obtenerHarnessRecomendaciones: () =>
    fetch(`${API_URL}/harness/recomendaciones`, {
      headers: getAuthHeaders(),
    }).then(manejarRespuesta),

  // AUTENTICACIÓN
  login: async (email, password) => {
    console.log('api.login() llamado, API_URL:', API_URL);
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    console.log('Respuesta del servidor:', res.status, res.statusText);
    return manejarRespuesta(res);
  },

  register: (email, password, nombre) =>
    fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nombre }),
    }).then(manejarRespuesta),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },

  setAuthToken: (token, remember = true) => {
    if (remember) {
      localStorage.setItem('token', token);
      sessionStorage.removeItem('token');
    } else {
      sessionStorage.setItem('token', token);
      localStorage.removeItem('token');
    }
  },

  setUser: (user, remember = true) => {
    if (remember) {
      localStorage.setItem('user', JSON.stringify(user));
      sessionStorage.removeItem('user');
    } else {
      sessionStorage.setItem('user', JSON.stringify(user));
      localStorage.removeItem('user');
    }
  },

  getAuthToken: () => localStorage.getItem('token') || sessionStorage.getItem('token'),

  getUser: () => {
    const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!rawUser) return null;
    try {
      const parsed = JSON.parse(rawUser);
      const token = api.getAuthToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp && Date.now() >= payload.exp * 1000) {
            api.logout();
            return null;
          }
        } catch {
          // Si el token no tiene formato JWT, continuar
        }
      }
      return parsed;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => !!api.getAuthToken(),
};

function getAuthHeaders() {
  const token = api.getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export { API_URL };
