import { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/themeContext';
import PurchaseList from './purchaseList';
import SearchBar from './searchBar';
import BottomSheet from './bottomSheet';
import MultiSelectFilterSheet from './multiSelectFilterSheet';
import { timestampToDate } from '../utils/date';
import { DEFAULT_WEAR_GOAL, getWearGoalProgress } from '../utils/wears';

const sortOptions = [
  { label: 'Last worn', value: 'lastWorn' },
  { label: 'Date added', value: 'dateAdded' },
  { label: 'Wear count', value: 'wears' },
  { label: 'Goal progress', value: 'progress' },
  { label: 'A-Z', value: 'name' },
];

const getCategoryName = (purchase) =>
  typeof purchase.category === 'string' ? purchase.category : purchase.category?.category;

const getSortValue = (purchase, sortField) => {
  if (sortField === 'lastWorn') {
    const lastWear = purchase.wears?.[purchase.wears.length - 1];
    return timestampToDate(lastWear)?.getTime() || 0;
  }

  if (sortField === 'wears') return purchase.wears?.length || 0;

  if (sortField === 'progress') {
    const wearCount = purchase.wears?.length || 0;
    const wearGoal = purchase.wearGoal ?? DEFAULT_WEAR_GOAL;
    return getWearGoalProgress(wearCount, wearGoal).percentage;
  }

  return timestampToDate(purchase.dateCreated)?.getTime() || 0;
};

const ItemsBrowser = ({
  purchases,
  navigation,
  loading,
  refreshing,
  onRefresh,
  selectedItems,
  onItemToggle,
  onAddWear,
  addingWearItemId,
  isWearLoggedToday,
  selectionMode = false,
  renderEndAction,
  emptyMessage = 'No items found',
  emptyHint = 'Pull down to refresh',
}) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  const categories = useSelector((state) => state.user.categories);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [categorySheetVisible, setCategorySheetVisible] = useState(false);
  const [colorSheetVisible, setColorSheetVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [sortField, setSortField] = useState('dateAdded');
  const [sortDirection, setSortDirection] = useState('desc');

  const categoryOptions = Array.from(
    new Set(categories.filter((category) => !category.custom).map((category) => category.name))
  ).filter(Boolean);

  const filteredPurchases = purchases
    .filter(
      (purchase) =>
        purchase.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedCategories.length === 0 ||
          selectedCategories.includes(getCategoryName(purchase))) &&
        (selectedColors.length === 0 || selectedColors.includes(purchase.itemColor?.name))
    )
    .sort((a, b) => {
      if (sortField === 'name') {
        const comparison = (a.name || '').localeCompare(b.name || '');
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      const aValue = getSortValue(a, sortField);
      const bValue = getSortValue(b, sortField);
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

  const activeSortLabel = sortOptions.find((option) => option.value === sortField)?.label;

  const getEmptyMessage = () => {
    if (searchQuery) return `No items match "${searchQuery}"`;
    if (selectedCategories.length > 0) return 'No items match the selected categories';
    if (selectedColors.length > 0) return 'No items match the selected colors';
    return emptyMessage;
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search items"
          style={styles.searchBar}
        />
        <TouchableOpacity
          onPress={() => setCategorySheetVisible(true)}
          style={[styles.filterButton, selectedCategories.length > 0 && styles.filterButtonActive]}
          accessibilityRole="button"
          accessibilityLabel="Filter items by category"
        >
          <Ionicons
            name="pricetags-outline"
            size={22}
            color={selectedCategories.length > 0 ? colors.primary : colors.gray}
          />
          {selectedCategories.length > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{selectedCategories.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setColorSheetVisible(true)}
          style={[styles.filterButton, selectedColors.length > 0 && styles.filterButtonActive]}
          accessibilityRole="button"
          accessibilityLabel="Filter items by color"
        >
          <Ionicons
            name="color-palette-outline"
            size={22}
            color={selectedColors.length > 0 ? colors.primary : colors.gray}
          />
          {selectedColors.length > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{selectedColors.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.countContainer}>
        <View style={styles.resultsLeft}>
          <Text style={styles.count}>Sorted by</Text>
          <TouchableOpacity
            style={styles.sortControl}
            onPress={() => setSortSheetVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={`Change sort. Currently sorted by ${activeSortLabel} ${
              sortDirection === 'asc' ? 'ascending' : 'descending'
            }`}
            hitSlop={8}
          >
            <Text style={styles.sortValue}>{activeSortLabel}</Text>
            <Ionicons
              name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
              size={14}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.resultCount}>{filteredPurchases.length} found</Text>
      </View>

      {!loading && filteredPurchases.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyState}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Ionicons name="search-outline" size={28} color={colors.gray} />
          <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
          <Text style={styles.emptyHint}>{emptyHint}</Text>
        </ScrollView>
      ) : (
        <PurchaseList
          purchases={filteredPurchases}
          refreshing={refreshing}
          onRefresh={onRefresh}
          loading={loading}
          navigation={navigation}
          onItemLongPress={onItemToggle}
          selectedItems={selectedItems}
          onAddWear={onAddWear}
          addingWearItemId={addingWearItemId}
          isWearLoggedToday={isWearLoggedToday}
          selectionMode={selectionMode}
          renderEndAction={renderEndAction}
        />
      )}

      <BottomSheet
        visible={sortSheetVisible}
        onClose={() => setSortSheetVisible(false)}
        title="Sort by"
        height={360}
      >
        {sortOptions.map((option, index) => {
          const isActive = sortField === option.value;
          const arrow = isActive ? (sortDirection === 'asc' ? 'arrow-up' : 'arrow-down') : null;

          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                if (isActive) {
                  setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
                } else {
                  setSortField(option.value);
                  setSortDirection(option.value === 'name' ? 'asc' : 'desc');
                }
              }}
              style={[
                styles.sortOption,
                { borderBottomWidth: index === sortOptions.length - 1 ? 0 : 1 },
              ]}
            >
              <Text style={styles.sortLabel}>{option.label}</Text>
              {arrow && <Ionicons name={arrow} size={18} color={colors.gray} />}
            </TouchableOpacity>
          );
        })}
      </BottomSheet>
      <MultiSelectFilterSheet
        visible={categorySheetVisible}
        onClose={() => setCategorySheetVisible(false)}
        title="Filter by category"
        allLabel="All categories"
        options={categoryOptions}
        selectedValues={selectedCategories}
        onChange={setSelectedCategories}
      />
      <MultiSelectFilterSheet
        visible={colorSheetVisible}
        onClose={() => setColorSheetVisible(false)}
        title="Filter by color"
        allLabel="All colors"
        options={colors.itemColorOptions}
        selectedValues={selectedColors}
        onChange={setSelectedColors}
        getLabel={(option) => option.name}
        getValue={(option) => option.name}
        renderLeading={(option) => (
          <View
            style={[
              styles.colorSwatch,
              {
                backgroundColor: option.hex,
                borderColor:
                  option.name === 'White' || option.name === 'Black' ? colors.gray : option.hex,
              },
            ]}
          />
        )}
      />
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1 },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 8,
      gap: 10,
    },
    searchBar: { flex: 1 },
    filterButton: {
      width: 46,
      height: 46,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.lightGrey,
      backgroundColor: colors.white,
    },
    filterButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    filterBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    filterBadgeText: { color: 'white', fontSize: 10, fontWeight: '700' },
    countContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.white,
      paddingHorizontal: 14,
      paddingBottom: 10,
      marginBottom: 1,
    },
    resultsLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    count: { color: colors.gray, fontSize: 13 },
    sortValue: { color: colors.primary, fontSize: 13, fontWeight: '700' },
    sortControl: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    resultCount: { color: colors.black, fontSize: 13, fontWeight: '500' },
    emptyState: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 24,
      paddingBottom: 100,
    },
    emptyText: {
      fontSize: 15,
      color: colors.black,
      fontWeight: '500',
      textAlign: 'center',
    },
    emptyHint: { color: colors.gray, textAlign: 'center' },
    sortOption: {
      width: '100%',
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomColor: colors.bg,
    },
    sortLabel: { fontSize: 15, color: colors.black },
    colorSwatch: { width: 18, height: 18, borderRadius: 12, borderWidth: 1 },
  });

export default ItemsBrowser;
