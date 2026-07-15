import { generateFirestoreTimestampFromDate, getDateKeyInTimeZone, timestampToDate } from './date';
import { updateMultiplePurchaseWears } from './firebase';

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

export const isCollectionWornToday = ({ collection, purchases, timeZone }) => {
  const collectionPurchases = getCollectionPurchases(collection, purchases);
  if (collectionPurchases.length === 0) return false;

  const todayKey = getDateKeyInTimeZone(new Date(), timeZone);
  return collectionPurchases.every((purchase) =>
    (purchase.wears || []).some((wear) => getDateKeyInTimeZone(wear, timeZone) === todayKey)
  );
};

export const addWearToCollectionToday = async ({ collection, purchases, timeZone }) => {
  const collectionPurchases = getCollectionPurchases(collection, purchases);

  if (collectionPurchases.length === 0) {
    return {
      updatedPurchases: purchases,
      didUpdate: false,
      message: null,
    };
  }

  const wearDate = new Date();
  const todayKey = getDateKeyInTimeZone(wearDate, timeZone);
  const newWear = generateFirestoreTimestampFromDate(wearDate);
  const updates = collectionPurchases
    .filter(
      (purchase) =>
        !(purchase.wears || []).some((wear) => getDateKeyInTimeZone(wear, timeZone) === todayKey)
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
      message: 'Every item in this collection is already worn today',
    };
  }

  await updateMultiplePurchaseWears(
    updates.map(({ purchaseId, updatedItem }) => ({
      purchaseId,
      wears: updatedItem.wears,
    }))
  );

  const updatesById = new Map(
    updates.map(({ purchaseId, updatedItem }) => [purchaseId, updatedItem])
  );
  const updatedPurchases = purchases.map((purchase) => updatesById.get(purchase.key) || purchase);
  const skippedCount = collectionPurchases.length - updates.length;
  const addedText = `${updates.length} wear${updates.length === 1 ? '' : 's'} added`;
  const skippedText = skippedCount > 0 ? `, ${skippedCount} already worn today` : '';

  return {
    updatedPurchases,
    didUpdate: true,
    message: `${addedText}${skippedText}`,
  };
};
