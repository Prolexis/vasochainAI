import { useState } from 'react';
import { api } from '../lib/api';
import { usePolling } from '../lib/usePolling';

export default function Beneficiarios() {
  const { datos: beneficiarios, refrescar } = usePolling(
    api.listarBeneficiarios,
    8000,
  );

  const [formulario, setFormulario] = useState({
    nombreMadre: '',
    dniMadre: '',
    parentesco: 'Madre',
    nombreMenor: '',
    dniMenor: '',
    clubMadres: '',
    sector: '',
  });

  const [qrSeleccionado, setQrSeleccionado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState(null);

  const actualizarCampo = (campo) => (e) =>
    setFormulario((prev) => ({ ...prev, [campo]: e.target.value }));

  const enviarFormulario = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErrorForm(null);

    // Formatear para trazabilidad del PVL: Nombre del niño + Tutora/Madre
    const nombreCompuesto = formulario.nombreMadre 
      ? `${formulario.nombreMenor.trim()} (${formulario.parentesco}: ${formulario.nombreMadre.trim()})`
      : formulario.nombreMenor.trim();

    const dniCompuesto = formulario.dniMenor.trim() || formulario.dniMadre.trim();

    try {
      await api.crearBeneficiario({
        nombre: nombreCompuesto,
        dni: dniCompuesto,
        clubMadres: formulario.clubMadres.trim(),
        sector: formulario.sector.trim(),
      });

      setFormulario({
        nombreMadre: '',
        dniMadre: '',
        parentesco: 'Madre',
        nombreMenor: '',
        dniMenor: '',
        clubMadres: '',
        sector: '',
      });
      await refrescar();
    } catch (err) {
      setErrorForm(err.message || 'Error al registrar beneficiario');
    } finally {
      setEnviando(false);
    }
  };

  const eliminar = async (id) => {
    if (window.confirm('¿Deseas eliminar este registro del padrón?')) {
      await api.eliminarBeneficiario(id);
      await refrescar();
    }
  };

  // Helper para desglosar nombre de niño y apoderada
  const parsearBeneficiario = (nombre) => {
    const match = nombre.match(/^(.*?)\s*\((.*?):\s*(.*?)\)$/);
    if (match) {
      return {
        menor: match[1],
        rolTutor: match[2],
        apoderada: match[3],
      };
    }
    return { menor: nombre, rolTutor: 'Titular', apoderada: null };
  };

  return (
    <div className="space-y-8">
      {/* 1. Header con Explicación de Roles */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              PADRÓN OFICIAL PVL · TRUJILLO
            </div>
            <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-paper-100 mt-2 font-bold">
              Padrón de Beneficiarios
            </h1>
            <p className="text-paper-300/70 text-base max-w-3xl leading-relaxed mt-1">
              Registro biométrico y documental de la <strong>Madre / Tutora</strong> y su <strong>Menor Beneficiario</strong>. Cada registro genera una credencial con código QR inmutable.
            </p>
          </div>
        </div>

        {/* Banner Informativo de Roles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-ledger-900 border border-ledger-700/80 text-xs font-mono">
          <div className="flex items-start gap-2.5">
            <span className="text-xl">🏛️</span>
            <div>
              <p className="text-emerald-400 font-bold uppercase tracking-wider">Tu Rol: Operador Municipal</p>
              <p className="text-paper-300/60 mt-0.5">Autoridad que ingresa y valida los datos oficiales en el sistema.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 border-t md:border-t-0 md:border-l border-ledger-700/80 pt-2 md:pt-0 md:pl-3">
            <span className="text-xl">👩‍👧</span>
            <div>
              <p className="text-amber-400 font-bold uppercase tracking-wider">Titular: Madre / Apoderada</p>
              <p className="text-paper-300/60 mt-0.5">Quien acude al comedor y recoge la ración con su carnet QR.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 border-t md:border-t-0 md:border-l border-ledger-700/80 pt-2 md:pt-0 md:pl-3">
            <span className="text-xl">🥛</span>
            <div>
              <p className="text-teal-400 font-bold uppercase tracking-wider">Beneficiario: Niño / Menor</p>
              <p className="text-paper-300/60 mt-0.5">Destinatario nutricional prioritario (0 a 6 años / gestante).</p>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Formulario y Lista */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Formulario Estructurado */}
        <form
          onSubmit={enviarFormulario}
          className="lg:col-span-5 rounded-3xl border border-ledger-700 bg-ledger-900 p-6 sm:p-7 shadow-soft-xl space-y-6"
        >
          <div className="border-b border-ledger-700/80 pb-4">
            <h2 className="font-display text-xl font-bold text-paper-100 flex items-center gap-2">
              <span>✍️</span> Empadronar Nuevo Binomio
            </h2>
            <p className="text-xs text-paper-300/60 font-mono mt-1">
              Ingresa los datos de la madre/tutora y del niño beneficiario.
            </p>
          </div>

          {/* Bloque 1: Datos de la Madre / Apoderada */}
          <div className="p-4 rounded-2xl bg-ledger-950/60 border border-ledger-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>👩‍👦</span> 1. Madre o Apoderada (Titular)
              </span>
              <span className="text-[10px] text-paper-300/50 font-mono">Quien recoge la leche</span>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-paper-300/70 font-mono mb-1.5 block">
                Nombre de la Madre / Tutora
              </label>
              <input
                required
                value={formulario.nombreMadre}
                onChange={actualizarCampo('nombreMadre')}
                className="w-full rounded-xl border border-ledger-600 bg-ledger-900 px-4 py-2.5 text-sm text-paper-100 placeholder:text-paper-300/30 focus:border-amber-400 focus:outline-none transition-all"
                placeholder="Ej: Rosa María Quispe Flores"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-paper-300/70 font-mono mb-1.5 block">
                  DNI de la Madre
                </label>
                <input
                  required
                  value={formulario.dniMadre}
                  onChange={actualizarCampo('dniMadre')}
                  maxLength={8}
                  className="w-full rounded-xl border border-ledger-600 bg-ledger-900 px-4 py-2.5 text-sm text-paper-100 placeholder:text-paper-300/30 focus:border-amber-400 focus:outline-none transition-all"
                  placeholder="Ej: 41829304"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-paper-300/70 font-mono mb-1.5 block">
                  Parentesco
                </label>
                <select
                  value={formulario.parentesco}
                  onChange={actualizarCampo('parentesco')}
                  className="w-full rounded-xl border border-ledger-600 bg-ledger-900 px-3 py-2.5 text-sm text-paper-100 focus:border-amber-400 focus:outline-none transition-all"
                >
                  <option value="Madre">Madre</option>
                  <option value="Padre">Padre</option>
                  <option value="Abuela">Abuela</option>
                  <option value="Tutora">Tutora Legal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bloque 2: Datos del Niño Beneficiario */}
          <div className="p-4 rounded-2xl bg-ledger-950/60 border border-ledger-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>👶</span> 2. Niño / Menor Beneficiario
              </span>
              <span className="text-[10px] text-paper-300/50 font-mono">Consumidor final</span>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-paper-300/70 font-mono mb-1.5 block">
                Nombre Completo del Niño(a)
              </label>
              <input
                required
                value={formulario.nombreMenor}
                onChange={actualizarCampo('nombreMenor')}
                className="w-full rounded-xl border border-ledger-600 bg-ledger-900 px-4 py-2.5 text-sm text-paper-100 placeholder:text-paper-300/30 focus:border-teal-400 focus:outline-none transition-all"
                placeholder="Ej: Ricardo Bernardo Velásquez"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-paper-300/70 font-mono mb-1.5 block">
                DNI del Menor o C.N.V.
              </label>
              <input
                required
                value={formulario.dniMenor}
                onChange={actualizarCampo('dniMenor')}
                maxLength={9}
                className="w-full rounded-xl border border-ledger-600 bg-ledger-900 px-4 py-2.5 text-sm text-paper-100 placeholder:text-paper-300/30 focus:border-teal-400 focus:outline-none transition-all"
                placeholder="Ej: 72250978"
              />
            </div>
          </div>

          {/* Bloque 3: Organización Comunitaria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-paper-300/70 font-mono mb-1.5 block">
                Club de Madres / Comité
              </label>
              <input
                required
                value={formulario.clubMadres}
                onChange={actualizarCampo('clubMadres')}
                className="w-full rounded-xl border border-ledger-600 bg-ledger-950 px-4 py-2.5 text-sm text-paper-100 placeholder:text-paper-300/30 focus:border-emerald-400 focus:outline-none transition-all"
                placeholder="Ej: Club Las Flores"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-paper-300/70 font-mono mb-1.5 block">
                Sector / Distrito
              </label>
              <input
                required
                value={formulario.sector}
                onChange={actualizarCampo('sector')}
                className="w-full rounded-xl border border-ledger-600 bg-ledger-950 px-4 py-2.5 text-sm text-paper-100 placeholder:text-paper-300/30 focus:border-emerald-400 focus:outline-none transition-all"
                placeholder="Ej: El Porvenir"
              />
            </div>
          </div>

          {errorForm && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
              {errorForm}
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-sm py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            {enviando ? (
              <span>Registrando y generando sello...</span>
            ) : (
              <>
                <span>Sellar y Generar Carnet QR</span>
                <span>🛡️</span>
              </>
            )}
          </button>
        </form>

        {/* Lista de Beneficiarios Empadronados */}
        <div className="lg:col-span-7 rounded-3xl border border-ledger-700 bg-ledger-900 overflow-hidden shadow-soft-xl">
          <div className="px-6 py-4 border-b border-ledger-700 flex items-center justify-between bg-ledger-950/40">
            <div>
              <p className="text-paper-100 font-display font-bold text-base">
                Padrón Activo · {(beneficiarios || []).length} Registros
              </p>
              <p className="text-xs text-paper-300/50 font-mono">
                Credenciales verificadas y vinculadas
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Vigentes
            </span>
          </div>

          {(beneficiarios || []).length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <span className="text-4xl block">📋</span>
              <p className="text-paper-200 font-display font-semibold text-base">
                El padrón está vacío
              </p>
              <p className="text-paper-300/50 text-xs font-mono max-w-sm mx-auto">
                Registra el primer binomio (Madre y Niño) usando el formulario de la izquierda para expedir el primer carnet QR.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-ledger-700/60 max-h-[640px] overflow-y-auto scroll-thin">
              {(beneficiarios || []).map((b) => {
                const info = parsearBeneficiario(b.nombre);
                return (
                  <li
                    key={b.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-ledger-800/50 transition-colors"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Nombre del Niño */}
                      <div className="flex items-center gap-2">
                        <span className="text-base">👶</span>
                        <p className="text-sm font-bold text-paper-100 truncate">
                          {info.menor}
                        </p>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                          Beneficiario
                        </span>
                      </div>

                      {/* Madre / Apoderada */}
                      {info.apoderada && (
                        <p className="text-xs text-amber-300/90 font-mono flex items-center gap-1.5 pl-6">
                          <span>👩‍👦</span>
                          <span>{info.rolTutor}: <strong>{info.apoderada}</strong></span>
                        </p>
                      )}

                      {/* Detalles: DNI, Club, Sector */}
                      <p className="text-[11px] text-paper-300/60 font-mono pl-6 flex flex-wrap gap-x-3 gap-y-1">
                        <span>🆔 DNI: <strong>{b.dni}</strong></span>
                        <span>🏛️ {b.clubMadres}</span>
                        <span>📍 {b.sector}</span>
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => setQrSeleccionado(b)}
                        className="text-xs font-mono px-3.5 py-2 rounded-xl bg-ledger-800 hover:bg-ledger-700 border border-ledger-600 hover:border-emerald-400 text-paper-200 hover:text-emerald-300 transition-all flex items-center gap-1.5"
                      >
                        <span>Ver Carnet QR</span>
                        <span>🔍</span>
                      </button>
                      <button
                        onClick={() => eliminar(b.id)}
                        className="text-xs font-mono p-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/15 transition-all"
                        title="Eliminar del padrón"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* 3. Modal Oficial de Carnet del Beneficiario con QR */}
      {qrSeleccionado && (() => {
        const info = parsearBeneficiario(qrSeleccionado.nombre);
        return (
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
            onClick={() => setQrSeleccionado(null)}
          >
            <div
              className="bg-ledger-900 border border-ledger-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Encabezado del Carnet */}
              <div className="text-center space-y-1 border-b border-ledger-700/80 pb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono uppercase tracking-wider font-bold">
                  PROGRAMA VASO DE LECHE · MUNICIPALIDAD DE TRUJILLO
                </div>
                <h3 className="font-display text-xl font-bold text-white pt-2">
                  Carnet Oficial de Entrega
                </h3>
                <p className="text-xs text-paper-300/60 font-mono">
                  Credencial digital para recepción y trazabilidad de raciones
                </p>
              </div>

              {/* Tarjeta del Carnet */}
              <div className="rounded-2xl bg-gradient-to-b from-ledger-950 to-ledger-900 border border-ledger-700 p-5 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-teal-400 font-bold">👶 Menor:</span>
                  <span className="text-white font-bold">{info.menor}</span>
                </div>

                {info.apoderada && (
                  <div className="flex items-center justify-between text-xs font-mono border-t border-ledger-800 pt-2">
                    <span className="text-amber-400 font-bold">👩‍👦 {info.rolTutor}:</span>
                    <span className="text-white">{info.apoderada}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs font-mono border-t border-ledger-800 pt-2">
                  <span className="text-paper-300/60">DNI Registrado:</span>
                  <span className="text-white font-mono">{qrSeleccionado.dni}</span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono border-t border-ledger-800 pt-2">
                  <span className="text-paper-300/60">Comité / Sector:</span>
                  <span className="text-paper-200">{qrSeleccionado.clubMadres} · {qrSeleccionado.sector}</span>
                </div>

                {/* Imagen del Código QR */}
                <div className="bg-white rounded-2xl p-4 text-center mt-3 shadow-inner">
                  <img
                    src={api.urlQr(qrSeleccionado.id)}
                    alt={`Código QR de ${qrSeleccionado.nombre}`}
                    className="w-48 h-48 mx-auto"
                  />
                  <p className="text-[10px] text-slate-600 font-mono mt-2 font-bold uppercase tracking-wider">
                    Escanear en punto de distribución
                  </p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-[10px] text-paper-300/40 font-mono break-all">
                  Sello ID: {qrSeleccionado.id}
                </p>
                <button
                  onClick={() => setQrSeleccionado(null)}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-ledger-800 hover:bg-ledger-700 text-paper-200 text-xs font-mono transition-colors cursor-pointer"
                >
                  Cerrar Ventana
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

