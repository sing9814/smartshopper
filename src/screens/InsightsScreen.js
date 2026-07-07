import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../components/header';
import { useStatusBar } from '../hooks/useStatusBar';
import { useTheme } from '../theme/themeContext';
import { timestampToDate } from '../utils/date';
import { DEFAULT_WEAR_GOAL, getWearGoalProgress } from '../utils/wears';
import { getItemColorBorder } from '../utils/itemColor';

const getLastWearDate = (item) => {
  const wears = item.wears || [];
  return timestampToDate(wears[wears.length - 1]);
};

const getWearCount = (item) => item?.wears?.length || 0;

const getLastWearTime = (item) => getLastWearDate(item)?.getTime() || 0;

const getColorName = (item) => item.itemColor?.name || 'No color';

const getColorHex = (item, colors) => item.itemColor?.hex || colors.noColor;

const getColorDistribution = (purchases, colors) => {
  const colorCounts = purchases.reduce((groups, item) => {
    const label = getColorName(item);

    groups[label] = groups[label] || {
      label,
      color: getColorHex(item, colors),
      count: 0,
    };
    groups[label].count += 1;

    return groups;
  }, {});

  const paletteDistribution = colors.itemColorOptions.map((option, index) => ({
    label: option.name,
    color: option.hex,
    count: colorCounts[option.name]?.count || 0,
    order: index,
  }));
  const extraDistribution = Object.values(colorCounts)
    .filter((item) => !colors.itemColorOptions.some((option) => option.name === item.label))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return [...paletteDistribution, ...extraDistribution];
};

const sortByLeastWorn = (a, b) => {
  const wearDifference = getWearCount(a) - getWearCount(b);
  if (wearDifference !== 0) return wearDifference;

  return getLastWearTime(a) - getLastWearTime(b);
};

const InsightsScreen = () => {
  const colors = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = createStyles(colors, tabBarHeight);
  const purchases = useSelector((state) => state.purchase.purchases || []);
  const mostWorn = [...purchases].sort((a, b) => getWearCount(b) - getWearCount(a))[0] || null;
  const leastWorn =
    purchases.length > 1
      ? [...purchases].filter((item) => item.key !== mostWorn?.key).sort(sortByLeastWorn)[0]
      : null;
  const colorDistribution = getColorDistribution(purchases, colors);
  const activeColors = colorDistribution
    .filter((item) => item.count > 0)
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));
  const unusedColors = colorDistribution
    .filter((item) => item.count === 0)
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));

  useStatusBar(colors.primary);

  return (
    <View style={styles.container}>
      <Header title="Insights" />

      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryRow}>
          <MetricCard label="Total items" value={purchases.length} styles={styles} />
          <MetricCard
            label="Total wears"
            value={purchases.reduce((total, item) => total + getWearCount(item), 0)}
            styles={styles}
          />
        </View>

        <View style={styles.analyticsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Item insights</Text>
            <Ionicons name="bulb-outline" size={20} color={colors.primary} />
          </View>

          <View style={styles.coverageRow}>
            <View style={styles.coverageIcon}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.coverageText}>
              {purchases.length
                ? `${purchases.filter((item) => getWearCount(item) > 0).length} of ${
                    purchases.length
                  } items have been worn`
                : 'Add items to start seeing trends'}
            </Text>
          </View>

          {mostWorn ? (
            <>
              <ItemInsight
                title="Most worn"
                icon="trending-up-outline"
                item={mostWorn}
                wearCount={getWearCount(mostWorn)}
                colors={colors}
                styles={styles}
              />
              <View style={styles.divider} />
              <ItemInsight
                title="Least worn"
                icon="trending-down-outline"
                item={leastWorn}
                wearCount={getWearCount(leastWorn)}
                colors={colors}
                styles={styles}
              />
            </>
          ) : (
            <Text style={styles.mutedText}>No items yet.</Text>
          )}
        </View>

        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Color breakdown</Text>
            <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
          </View>

          {purchases.length ? (
            <View style={styles.chartRows}>
              <View style={[styles.paletteStrip, styles.paletteStripWithLegend]}>
                {colorDistribution
                  .filter((item) => item.count > 0)
                  .map((item, index, visibleData) => (
                    <View
                      key={`${item.label}-palette`}
                      style={[
                        styles.paletteSegment,
                        {
                          flex: item.count,
                          marginLeft: index === 0 ? 0 : -8,
                          zIndex: visibleData.length - index,
                          backgroundColor: item.color,
                          borderColor: 'rgba(0, 0, 0, 0.2)',
                        },
                        index === 0 && styles.paletteSegmentFirst,
                        index === visibleData.length - 1 && styles.paletteSegmentLast,
                      ]}
                    />
                  ))}
              </View>
              <View style={styles.legendGroups}>
                {activeColors.length > 0 && (
                  <View style={styles.legendGroup}>
                    <View style={styles.legendList}>
                      {activeColors.map((item) => {
                        const percent = Math.round((item.count / purchases.length) * 100);

                        return (
                          <View key={item.label} style={styles.legendItem}>
                            <View
                              style={[
                                styles.chartSwatch,
                                styles.legendSwatch,
                                {
                                  backgroundColor: item.color,
                                  borderColor: getItemColorBorder(
                                    { name: item.label, hex: item.color },
                                    colors
                                  ),
                                },
                              ]}
                            />
                            <Text style={styles.legendLabel} numberOfLines={1}>
                              {item.label}
                            </Text>
                            <Text style={styles.legendValue}>
                              {item.count} ({percent}%)
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {unusedColors.length > 0 && (
                  <View style={styles.legendGroup}>
                    <Text style={styles.legendGroupTitle}>Not logged yet</Text>
                    <View style={[styles.legendList, styles.unusedLegendList]}>
                      {unusedColors.map((item) => (
                        <View key={item.label} style={styles.legendItem}>
                          <View
                            style={[
                              styles.chartSwatch,
                              styles.legendSwatch,
                              {
                                backgroundColor: item.color,
                                borderColor: getItemColorBorder(
                                  { name: item.label, hex: item.color },
                                  colors
                                ),
                              },
                            ]}
                          />
                          <Text style={styles.legendLabel} numberOfLines={1}>
                            {item.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <Text style={styles.mutedText}>Add items to see this breakdown.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const MetricCard = ({ label, value, styles }) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const ItemInsight = ({ title, icon, item, wearCount, colors, styles }) => {
  const wearGoal = item?.wearGoal ?? DEFAULT_WEAR_GOAL;
  const wearProgress = getWearGoalProgress(wearCount, wearGoal);

  if (!item) {
    return (
      <View>
        <Text style={styles.insightLabel}>{title}</Text>
        <Text style={styles.mutedText}>Not enough items yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.highlightRow}>
      <View style={styles.insightIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.highlightText}>
        <Text style={styles.insightLabel}>{title}</Text>
        <Text style={styles.highlightTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.mutedText}>{wearProgress.detailLabel}</Text>
      </View>
      <Text style={styles.highlightValue}>{wearCount} wears</Text>
    </View>
  );
};

const createStyles = (colors, tabBarHeight) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroller: {
      flex: 1,
    },
    scrollView: {
      flexGrow: 1,
      paddingTop: 10,
      paddingBottom: tabBarHeight + 16,
      paddingHorizontal: 16,
      gap: 10,
    },
    analyticsCard: {
      backgroundColor: colors.white,
      borderRadius: 10,
      padding: 16,
      gap: 12,
      elevation: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardTitle: {
      color: colors.black,
      fontSize: 16,
      fontWeight: '700',
    },
    coverageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderRadius: 8,
      backgroundColor: colors.white,
      elevation: 2,
      marginBottom: 4,
    },
    coverageIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    coverageText: {
      flex: 1,
      color: colors.black,
      fontSize: 14,
      fontWeight: '500',
    },
    highlightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    insightIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    highlightText: {
      flex: 1,
    },
    highlightTitle: {
      color: colors.black,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    insightLabel: {
      color: colors.gray,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    highlightValue: {
      color: colors.gray,
    },
    divider: {
      height: 1,
      backgroundColor: colors.bg,
    },
    mutedText: {
      color: colors.gray,
      fontSize: 13,
    },
    chartCard: {
      backgroundColor: colors.white,
      borderRadius: 10,
      padding: 16,
      gap: 14,
      elevation: 1,
    },
    chartRows: {
      gap: 12,
    },
    paletteStrip: {
      height: 20,
      flexDirection: 'row',
      overflow: 'hidden',
      borderRadius: 10,
      backgroundColor: colors.bg,
    },
    paletteStripWithLegend: {
      marginBottom: 8,
    },
    paletteSegment: {
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10,
      borderWidth: 0.5,
    },
    paletteSegmentFirst: {
      borderTopLeftRadius: 10,
      borderBottomLeftRadius: 10,
    },
    paletteSegmentLast: {
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10,
    },
    chartSwatch: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 1,
    },
    legendSwatch: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    legendGroups: {
      gap: 14,
    },
    legendGroup: {
      gap: 14,
    },
    legendGroupTitle: {
      color: colors.gray,
      fontSize: 13,
    },
    legendList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 22,
      rowGap: 16,
    },
    unusedLegendList: {
      paddingBottom: 8,
    },
    legendItem: {
      minWidth: '44%',
      maxWidth: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 8,
    },
    legendLabel: {
      flexShrink: 1,
      color: colors.black,
      fontSize: 13,
      fontWeight: '600',
    },
    legendValue: {
      color: colors.gray,
      fontSize: 12,
      fontWeight: '600',
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 10,
    },
    metricCard: {
      flex: 1,
      minHeight: 108,
      backgroundColor: colors.white,
      borderRadius: 10,
      padding: 16,
      elevation: 1,
    },
    metricValue: {
      color: colors.black,
      fontSize: 30,
      fontWeight: '700',
    },
    metricLabel: {
      color: colors.gray,
      fontSize: 13,
      marginTop: 4,
    },
  });

export default InsightsScreen;
