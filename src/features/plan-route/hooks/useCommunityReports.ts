import { useState, useRef, useCallback } from 'react';
import { Platform, ToastAndroid } from 'react-native';
import { Dialog } from '../../../shared/components/ui/AppDialog';
import {
  getNearbyReports,
  voteReport,
  type NearbyReport,
} from '../../../services/reports';
import type { PlacePoint } from '../types';

interface CommunityReportsOptions {
  t: (key: string) => string;
  defaultCenter?: { latitude: number; longitude: number };
}

export function useCommunityReports({ t, defaultCenter }: CommunityReportsOptions) {
  const [nearbyReports, setNearbyReports] = useState<NearbyReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<NearbyReport | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);

  const reportRefreshTimer = useRef<any>(null);

  const refreshNearbyReports = useCallback(
    async (center?: { latitude: number; longitude: number }) => {
      try {
        const c = center ?? defaultCenter;
        if (!c) return;
        const reports = await getNearbyReports(c.latitude, c.longitude, 2000);
        setNearbyReports(reports);
        console.log('[REPORTS]', reports.length, 'reportes cercanos');
      } catch (e: any) {
        console.log('[REPORTS] error:', e?.message);
      }
    },
    [defaultCenter]
  );

  const debounceRefreshReports = useCallback(
    (center: { latitude: number; longitude: number }, delayMs = 1500) => {
      if (reportRefreshTimer.current) clearTimeout(reportRefreshTimer.current);
      reportRefreshTimer.current = setTimeout(() => {
        refreshNearbyReports(center);
      }, delayMs);
    },
    [refreshNearbyReports]
  );

  const voteOnReport = useCallback(
    async (
      report: NearbyReport,
      confirm: boolean,
      userPos: PlacePoint | null,
      acquireLocation?: () => Promise<PlacePoint | null>
    ) => {
      if (votingId) return;

      let pos = userPos;
      if (!pos && acquireLocation) {
        pos = await acquireLocation();
      }

      if (!pos) {
        Dialog.alert(
          t('planRoute.locationRequiredTitle'),
          t('planRoute.voteLocationMsg'),
          { tone: 'warning', icon: 'navigate-circle' }
        );
        return;
      }

      setVotingId(report.id);
      try {
        const result = await voteReport(report.id, confirm, pos.latitude, pos.longitude);
        setNearbyReports(prev =>
          prev
            .map(r =>
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
            .filter(r => r.confidenceScore >= 40 && r.state !== 'disputed')
        );
        setSelectedReport(null);
        const msg = confirm
          ? t('planRoute.voteConfirmed')
          : t('planRoute.voteRejected');

        if (Platform.OS === 'android') {
          ToastAndroid.show(msg, ToastAndroid.SHORT);
        } else {
          Dialog.alert(t('planRoute.voteThanks'), msg);
        }
        console.log('[REPORTS] voto', confirm ? '👍' : '👎', report.id, '→', result.state, result.confidenceScore);
      } catch (e: any) {
        Dialog.alert(
          t('planRoute.voteError'),
          e?.message ?? t('planRoute.unexpectedError'),
          { tone: 'error' }
        );
      } finally {
        setVotingId(null);
      }
    },
    [votingId, t]
  );

  return {
    nearbyReports,
    setNearbyReports,
    selectedReport,
    setSelectedReport,
    votingId,
    setVotingId,
    reportSheetOpen,
    setReportSheetOpen,
    refreshNearbyReports,
    debounceRefreshReports,
    voteOnReport,
  };
}
