import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHook, act } from './helpers/hookTestHarness.mjs';

// ==============================================================================
// BEHAVIORAL SUITE: useCommunityReports
// ==============================================================================

function createCommunityReportsHookFactory(mockServices = {}) {
  const {
    getNearbyReports = async (lat, lng, r) => [
      { id: 'rep-1', title: 'Hueco en vía', confidenceScore: 80, confirmCount: 4, rejectCount: 0, state: 'confirmed' },
      { id: 'rep-2', title: 'Semáforo dañado', confidenceScore: 45, confirmCount: 1, rejectCount: 0, state: 'active' },
    ],
    voteReport = async (id, confirm, lat, lng) => ({
      confidenceScore: confirm ? 85 : 30,
      confirmCount: confirm ? 5 : 4,
      rejectCount: confirm ? 0 : 2,
      state: confirm ? 'confirmed' : 'disputed',
    }),
  } = mockServices;

  return function useCommunityReports(props, { useState, useRef, useCallback }) {
    const { t = (k) => k, defaultCenter = { latitude: 2.9273, longitude: -75.2819 } } = props;

    const [nearbyReports, setNearbyReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [votingId, setVotingId] = useState(null);
    const [reportSheetOpen, setReportSheetOpen] = useState(false);

    const reportRefreshTimer = useRef(null);

    const refreshNearbyReports = useCallback(
      async (center) => {
        try {
          const c = center ?? defaultCenter;
          if (!c) return;
          const reports = await getNearbyReports(c.latitude, c.longitude, 2000);
          setNearbyReports(reports);
        } catch (e) {}
      },
      [defaultCenter]
    );

    const debounceRefreshReports = useCallback(
      (center, delayMs = 50) => {
        if (reportRefreshTimer.current) clearTimeout(reportRefreshTimer.current);
        reportRefreshTimer.current = setTimeout(() => {
          refreshNearbyReports(center);
        }, delayMs);
      },
      [refreshNearbyReports]
    );

    const voteOnReport = useCallback(
      async (report, confirm, userPos, acquireLocation) => {
        if (votingId) return;

        let pos = userPos;
        if (!pos && acquireLocation) {
          pos = await acquireLocation();
        }

        if (!pos) {
          return { error: 'location_required' };
        }

        setVotingId(report.id);
        try {
          const result = await voteReport(report.id, confirm, pos.latitude, pos.longitude);
          setNearbyReports((prev) =>
            prev
              .map((r) =>
                r.id === report.id
                  ? {
                      ...r,
                      confidenceScore: result.confidenceScore,
                      confirmCount: result.confirmCount,
                      rejectCount: result.rejectCount,
                      state: result.state,
                    }
                  : r
              )
              .filter((r) => r.confidenceScore >= 40 && r.state !== 'disputed')
          );
          setSelectedReport(null);
          return { success: true, result };
        } finally {
          setVotingId(null);
        }
      },
      [votingId]
    );

    return {
      nearbyReports,
      setNearbyReports,
      selectedReport,
      setSelectedReport,
      votingId,
      reportSheetOpen,
      setReportSheetOpen,
      refreshNearbyReports,
      debounceRefreshReports,
      voteOnReport,
    };
  };
}

test('useCommunityReports: 1. Inicialización de estado de reportes', () => {
  const hook = createCommunityReportsHookFactory();
  const harness = renderHook((props, hooks) => hook(props, hooks));

  assert.deepEqual(harness.result.current.nearbyReports, []);
  assert.equal(harness.result.current.selectedReport, null);
  assert.equal(harness.result.current.votingId, null);
  assert.equal(harness.result.current.reportSheetOpen, false);
});

test('useCommunityReports: 2. Refresco con debounce cancela timers intermedios', async () => {
  let calls = 0;
  const hook = createCommunityReportsHookFactory({
    getNearbyReports: async () => {
      calls++;
      return [{ id: 'rep-debounced', title: 'Tráfico pesado' }];
    },
  });

  const harness = renderHook((props, hooks) => hook(props, hooks));

  const center = { latitude: 2.93, longitude: -75.28 };
  // Desplazamientos rápidos del mapa
  await act(() => harness.result.current.debounceRefreshReports(center, 40));
  await act(() => harness.result.current.debounceRefreshReports(center, 40));
  await act(() => harness.result.current.debounceRefreshReports(center, 40));

  // Esperar resolución
  await new Promise(r => setTimeout(r, 60));

  assert.equal(calls, 1, 'Debe ejecutarse una sola consulta tras las ráfagas debounced');
  assert.equal(harness.result.current.nearbyReports.length, 1);
  assert.equal(harness.result.current.nearbyReports[0].id, 'rep-debounced');
});

test('useCommunityReports: 3. Votación requiere ubicación GPS del usuario', async () => {
  let backendVoted = false;
  const hook = createCommunityReportsHookFactory({
    voteReport: async () => { backendVoted = true; return {}; },
  });

  const harness = renderHook((props, hooks) => hook(props, hooks));

  const report = { id: 'rep-1', title: 'Derrumbe' };
  // Intentar votar sin pos y sin acquireLocation
  const res = await harness.result.current.voteOnReport(report, true, null, null);

  assert.equal(res?.error, 'location_required', 'Debe rechazar el voto si no hay GPS disponible');
  assert.equal(backendVoted, false, 'No debe llamar al backend sin coordenadas GPS');
});

test('useCommunityReports: 4. Guard de concurrencia: bloquea doble clic en botón de votar', async () => {
  let voteCalls = 0;
  const hook = createCommunityReportsHookFactory({
    voteReport: async () => {
      voteCalls++;
      await new Promise(r => setTimeout(r, 40));
      return { confidenceScore: 90, confirmCount: 5, state: 'confirmed' };
    },
  });

  const harness = renderHook((props, hooks) => hook(props, hooks));
  const report = { id: 'rep-concurrent', title: 'Hueco' };
  const userPos = { latitude: 2.93, longitude: -75.28 };

  // Lanzar dos votos simultáneos
  const v1 = harness.result.current.voteOnReport(report, true, userPos);
  const v2 = harness.result.current.voteOnReport(report, true, userPos);
  await Promise.all([v1, v2]);

  assert.equal(voteCalls, 1, 'Solo debe emitir 1 voto concurrente');
  assert.equal(harness.result.current.votingId, null, 'votingId debe liberarse tras completar');
});

test('useCommunityReports: 5. Filtro de confianza: descarta del mapa reportes disputados o con confianza < 40', async () => {
  const hook = createCommunityReportsHookFactory({
    voteReport: async (id, confirm) => {
      // Si el usuario vota rechazar, la confianza cae a 25 y el estado es 'disputed'
      return {
        confidenceScore: 25,
        confirmCount: 1,
        rejectCount: 3,
        state: 'disputed',
      };
    },
  });

  const harness = renderHook((props, hooks) => hook(props, hooks));

  await act(() => {
    harness.result.current.setNearbyReports([
      { id: 'rep-valid', title: 'Vía cerrada', confidenceScore: 70, state: 'confirmed' },
      { id: 'rep-to-reject', title: 'Accidente falso', confidenceScore: 45, state: 'active' },
    ]);
  });

  const report = { id: 'rep-to-reject', title: 'Accidente falso' };
  const userPos = { latitude: 2.93, longitude: -75.28 };

  await act(async () => {
    await harness.result.current.voteOnReport(report, false, userPos);
  });

  // El reporte disputado con confianza < 40 debe haber sido filtrado
  assert.equal(harness.result.current.nearbyReports.length, 1);
  assert.equal(harness.result.current.nearbyReports[0].id, 'rep-valid');
});
