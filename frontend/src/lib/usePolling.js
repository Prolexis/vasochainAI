import { useEffect, useState, useCallback } from 'react';

/**
 * Hook de polling simple: ejecuta fetchFn inmediatamente y luego cada
 * `intervaloMs`. Usado para refrescar el dashboard en tiempo real sin
 * necesidad de WebSockets.
 */
export function usePolling(fetchFn, intervaloMs = 5000) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  const ejecutar = useCallback(async () => {
    try {
      const resultado = await fetchFn();
      setDatos(resultado);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    ejecutar();
    const id = setInterval(ejecutar, intervaloMs);
    return () => clearInterval(id);
  }, [ejecutar, intervaloMs]);

  return { datos, error, cargando, refrescar: ejecutar };
}
