import { generateFirestoreTimestampFromDate, getDateKeyInTimeZone, timestampToDate } from './date';
import { updateCollectionWearHistory } from './firebase';

const sortWearsByDate = (wears) =>
  [...wears].sort((a, b) => {
    const aTime = timestampToDate(a)?.getTime() || 0;
    const bTime = timestampToDate(b)?.getTime() || 0;

    return aTime - bTime;
  });

const getCollectionPurchases = (collection, purchases) => {
  const collectionItemIds = collection.items || [];
  return purchases.filter((purchase) => collectionItemIds.includes(purchase.key));
};

const updateWearHistoryForDate = ({ collection, wearDate, wearDateKey, itemIds, timeZone }) => {
  const wearHistory = collection.wearHistory || [];
  const existingEvent = wearHistory.find(
    (event) => getDateKeyInTimeZone(event.date, timeZone) === wearDateKey
  );

  if (existingEvent) {
    return wearHistory.map((event) =>
      event === existingEvent
        ? { ...event, itemIds: Array.from(new Set([...(event.itemIds || []), ...itemIds])) }
        : event
    );
  }

  return [...wearHistory, { date: generateFirestoreTimestampFromDate(wearDate), itemIds }].sort(
    (a, b) => {
      const aTime = timestampToDate(a.date)?.getTime() || 0;
      const bTime = timestampToDate(b.date)?.getTime() || 0;
      return aTime - bTime;
    }
  );
};

export const isCollectionWornToday = ({ collection, purchases, timeZone }) => {
  const collectionPurchases = getCollectionPurchases(collection, purchases);
  if (collectionPurchases.length === 0) return false;

  const todayKey = getDateKeyInTimeZone(new Date(), timeZone);
  return collectionPurchases.every((purchase) =>
    (purchase.wears || []).some((wear) => getDateKeyInTimeZone(wear, timeZone) === todayKey)
  );
};

export const addWearToCollectionDate = async ({ collection, purchases, timeZone, wearDate }) => {
  const collectionPurchases = getCollectionPurchases(collection, purchases);

  if (collectionPurchases.length === 0) {
    return {
      updatedPurchases: purchases,
      didUpdate: false,
      message: null,
    };
  }

  const wearDateKey = getDateKeyInTimeZone(wearDate, timeZone);
  const todayKey = getDateKeyInTimeZone(new Date(), timeZone);
  const isToday = wearDateKey === todayKey;
  const newWear = generateFirestoreTimestampFromDate(wearDate);
  const updates = collectionPurchases
    .filter(
      (purchase) =>
        !(purchase.wears || []).some((wear) => getDateKeyInTimeZone(wear, timeZone) === wearDateKey)
    )
    .map((purchase) => ({
      purchaseId: purchase.key,
      updatedItem: {
        ...purchase,
        wears: sortWearsByDate([...(purchase.wears || []), newWear]),
      },
    }));

  if (updates.length === 0) {
    return {
      updatedPurchases: purchases,
      didUpdate: false,
      message: `Every item in this outfit is already worn ${isToday ? 'today' : 'on that date'}`,
    };
  }

  const purchaseWearUpdates = updates.map(({ purchaseId, updatedItem }) => ({
    purchaseId,
    wears: updatedItem.wears,
  }));
  const wearHistory = updateWearHistoryForDate({
    collection,
    wearDate,
    wearDateKey,
    itemIds: updates.map(({ purchaseId }) => purchaseId),
    timeZone,
  });

  await updateCollectionWearHistory({
    collectionId: collection.id,
    wearHistory,
    purchaseWearUpdates,
  });

  const updatesById = new Map(
    updates.map(({ purchaseId, updatedItem }) => [purchaseId, updatedItem])
  );
  const updatedPurchases = purchases.map((purchase) => updatesById.get(purchase.key) || purchase);
  const skippedCount = collectionPurchases.length - updates.length;
  const addedText = `${updates.length} wear${updates.length === 1 ? '' : 's'} added`;
  const skippedText =
    skippedCount > 0 ? `, ${skippedCount} already worn ${isToday ? 'today' : 'on that date'}` : '';

  return {
    updatedPurchases,
    updatedCollection: { ...collection, wearHistory },
    didUpdate: true,
    message: `${addedText}${skippedText}`,
  };
};

export const addWearToCollectionToday = ({ collection, purchases, timeZone }) =>
  addWearToCollectionDate({
    collection,
    purchases,
    timeZone,
    wearDate: new Date(),
  });
