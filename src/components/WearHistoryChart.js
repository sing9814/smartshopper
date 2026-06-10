import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getDateKeyInTimeZone } from '../utils/date';
import { useTheme } from '../theme/themeContext';

const getWeekStart = (date) => {
  const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  return weekStart;
};

const getRecentWeeklyWearHistory = (wears, timeZone) => {
  const currentWeekStart = getWeekStart(new Date());
  const weeks = Array.from({ length: 12 }, (_, index) => {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() - (11 - index) * 7);
    const key = weekStart.toISOString().slice(0, 10);

    return {
      key,
      label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: 0,
    };
  });

  const weekIndex = weeks.reduce((lookup, week, index) => {
    lookup[week.key] = index;
    return lookup;
  }, {});

  (wears || []).forEach((wear) => {
    const dateKey = getDateKeyInTimeZone(wear, timeZone);
    if (!dateKey) return;

    const [year, month, day] = dateKey.split('-').map(Number);
    const wearWeekStart = getWeekStart(new Date(year, month - 1, day));
    const index = weekIndex[wearWeekStart.toISOString().slice(0, 10)];

    if (index != null) {
      weeks[index].count += 1;
    }
  });

  const maxCount = Math.max(...weeks.map((week) => week.count), 1);

  return weeks.map((week) => ({
    ...week,
    heightPercent: week.count === 0 ? 0 : Math.max(16, (week.count / maxCount) * 100),
  }));
};

const WearHistoryChart = ({ wears, timeZone }) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  const weeklyWearHistory = useMemo(
    () => getRecentWeeklyWearHistory(wears, timeZone),
    [wears, timeZone]
  );
  const recentWearCount = weeklyWearHistory.reduce((total, week) => total + week.count, 0);
  const maxWeeklyWearCount = Math.max(...weeklyWearHistory.map((week) => week.count), 1);
  const yAxisTicks = useMemo(() => {
    if (maxWeeklyWearCount <= 5) {
      return Array.from(
        { length: maxWeeklyWearCount + 1 },
        (_, index) => maxWeeklyWearCount - index
      );
    }

    return [
      maxWeeklyWearCount,
      Math.round(maxWeeklyWearCount * 0.75),
      Math.round(maxWeeklyWearCount * 0.5),
      Math.round(maxWeeklyWearCount * 0.25),
      0,
    ];
  }, [maxWeeklyWearCount]);
  const hasRecentWearHistory = recentWearCount > 0;

  return (
    <View style={styles.historyBlock}>
      <View style={styles.historyHeader}>
        <View style={styles.historyTitleRow}>
          <Text style={styles.historyHeadline}>{recentWearCount}</Text>
          <Text style={styles.historySubtext}>wears in the past 3 months</Text>
        </View>
      </View>

      {hasRecentWearHistory ? (
        <View style={styles.chartWithAxis}>
          <View style={styles.yAxis}>
            {yAxisTicks.map((tick, index) => (
              <View
                key={tick}
                style={[
                  styles.yAxisLabelSlot,
                  { transform: [{ translateY: -2 * (yAxisTicks.length - index - 1) }] },
                ]}
              >
                <Text style={styles.yAxisLabel}>{tick}</Text>
              </View>
            ))}
          </View>

          <View style={styles.chartBody}>
            <View style={styles.gridLayer} pointerEvents="none">
              {yAxisTicks.map((tick) => (
                <View key={tick} style={styles.gridLine} />
              ))}
            </View>

            <View style={styles.weekChart}>
              {weeklyWearHistory.map((week) => (
                <View key={week.key} style={styles.weekColumn}>
                  <View style={styles.weekBarSlot}>
                    <View style={[styles.weekBarFill, { height: `${week.heightPercent}%` }]} />
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.weekLabelRow}>
              {weeklyWearHistory.map((week, index) => (
                <View key={week.key} style={styles.weekLabelSlot}>
                  <Text style={styles.weekLabel} numberOfLines={1}>
                    {index % 2 === 0 ? week.label : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.historyEmpty}>
          <Text style={styles.historyEmptyText}>No wears logged in the past 3 months.</Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    historyBlock: {
      backgroundColor: colors.white,
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 16,
      marginHorizontal: 12,
      marginBottom: 12,
      borderRadius: 12,
      gap: 18,
      overflow: 'hidden',
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    historyTitleRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 7,
      flexShrink: 1,
    },
    historyHeadline: {
      color: colors.black,
      fontSize: 24,
      fontWeight: '800',
      lineHeight: 28,
    },
    historySubtext: {
      color: colors.gray,
      fontSize: 13,
      paddingBottom: 3,
    },
    chartWithAxis: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    yAxis: {
      width: 10,
      height: 128,
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    yAxisLabelSlot: {
      height: 10,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    yAxisLabel: {
      color: colors.gray,
      fontSize: 11,
      lineHeight: 12,
      textAlign: 'right',
    },
    chartBody: {
      flex: 1,
      height: 158,
    },
    gridLayer: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 128,
      justifyContent: 'space-between',
    },
    gridLine: {
      borderTopWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.lightGrey,
      opacity: 0.65,
    },
    weekChart: {
      height: 128,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 10,
    },
    weekColumn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      minWidth: 0,
    },
    weekBarSlot: {
      width: '100%',
      height: 128,
      justifyContent: 'flex-end',
    },
    weekBarFill: {
      width: '100%',
      maxWidth: 24,
      alignSelf: 'center',
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
      backgroundColor: colors.primary,
      // backgroundColor: '#1290F4',
    },
    weekLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 8,
      height: 18,
    },
    weekLabelSlot: {
      flex: 1,
      alignItems: 'center',
      minWidth: 0,
      overflow: 'visible',
    },
    weekLabel: {
      width: 44,
      color: colors.gray,
      fontSize: 10,
      lineHeight: 12,
      textAlign: 'center',
    },
    historyEmpty: {
      minHeight: 128,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bg,
      paddingHorizontal: 14,
    },
    historyEmptyText: {
      color: colors.gray,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

export default WearHistoryChart;
