import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NearbyReport } from '../../services/reports';
import { reportTypeEs } from '../../utils/reportTypeEs';
import { useLanguage } from '../../shared/store/LanguageContext';

interface Props {
  report: NearbyReport;
  voting: boolean;
  onClose: () => void;
  onVote: (confirm: boolean) => void;
}

const STATE_LABELS: Record<string, { text: string; color: string }> = {
  active: { text: 'report.voteActive', color: '#1a73e8' },
  confirmed: { text: 'report.voteConfirmed', color: '#16a34a' },
  disputed: { text: 'report.voteDisputed', color: '#d93025' },
  expired: { text: 'report.voteExpired', color: '#5f6368' },
};

/**
 * HU-22 / CU22: detalle de un reporte cercano con la pregunta
 * "¿Sigue ocurriendo?" y los botones de voto comunitario.
 */
export function ReportVoteSheet({ report, voting, onClose, onVote }: Props) {
  const { t } = useLanguage();
  const high = report.confidenceScore >= 70;
  const accent = high ? '#16a34a' : '#d97706';
  const state = STATE_LABELS[report.state] ?? STATE_LABELS.active;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: accent }]}>
          <Ionicons name="warning" size={16} color="#ffffff" />
        </View>
        <View style={styles.headerTexts}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {reportTypeEs(report.reportType, t)}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {(report.addressText ?? t('report.nearbyReport')) } · {Math.round(report.distanceMeters)} m
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color="#5f6368" />
        </TouchableOpacity>
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {report.description}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Ionicons name="shield-checkmark" size={14} color={accent} />
          <Text style={styles.statChipText}>{report.confidenceScore}%</Text>
        </View>
        <View style={styles.statChip}>
          <Ionicons name="thumbs-up" size={14} color="#16a34a" />
          <Text style={styles.statChipText}>{report.confirmCount}</Text>
        </View>
        <View style={styles.statChip}>
          <Ionicons name="thumbs-down" size={14} color="#dc2626" />
          <Text style={styles.statChipText}>{report.rejectCount}</Text>
        </View>
        <View style={[styles.stateChip, { backgroundColor: `${state.color}1f` }]}>
          <Text style={[styles.stateChipText, { color: state.color }]}>{t(state.text)}</Text>
        </View>
      </View>

      <Text style={styles.question}>{t('report.stillHappening')}</Text>

      <View style={styles.voteRow}>
        <TouchableOpacity
          style={[styles.voteBtn, styles.voteYes, voting && styles.voteBtnDisabled]}
          onPress={() => onVote(true)}
          disabled={voting}
          activeOpacity={0.8}
        >
          <Ionicons name="thumbs-up" size={16} color="#16a34a" />
          <Text style={styles.voteYesText}>{voting ? t('report.sending') : t('report.yes')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.voteBtn, styles.voteNo, voting && styles.voteBtnDisabled]}
          onPress={() => onVote(false)}
          disabled={voting}
          activeOpacity={0.8}
        >
          <Ionicons name="thumbs-down" size={16} color="#dc2626" />
          <Text style={styles.voteNoText}>{voting ? t('report.sending') : t('report.no')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>{t('report.voteHint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTexts: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202124',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#5f6368',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#3c4043',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f3f4',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3c4043',
  },
  stateChip: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 'auto',
  },
  stateChipText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  question: {
    fontSize: 15,
    fontWeight: '700',
    color: '#202124',
    marginTop: 16,
  },
  voteRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  voteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  voteYes: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  voteNo: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  voteBtnDisabled: {
    opacity: 0.6,
  },
  voteYesText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16a34a',
  },
  voteNoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#dc2626',
  },
  hint: {
    fontSize: 12,
    color: '#9aa0a6',
    marginTop: 12,
    lineHeight: 17,
  },
});
