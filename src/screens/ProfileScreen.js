import React, { useState } from 'react';
import {
  Linking,
  Modal,
  NativeModules,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import CustomButton from '../components/button';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useTheme, useToggleTheme, useIsDark } from '../theme/themeContext';
import WomanSVG from '../../assets/womanSVG';
import Header from '../components/header';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStatusBar } from '../hooks/useStatusBar';
import ConfirmationModal from '../components/confirmationModal';
import CustomInput from '../components/customInput';
import { setUser, setUserOnboarded } from '../redux/actions/userActions';
import { timestampToDate } from '../utils/date';
import { clearGuestData, setGuestActive, setGuestPendingAuthUid } from '../utils/guestStorage';

const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/1BWQtUvXFn9GeCFqAAg4uTJHN6H-54EXAnHxqzphthRg/viewform';
const AppInfo = NativeModules.AppInfo ?? {};
const appVersionText =
  AppInfo.versionName && AppInfo.buildNumber
    ? `Version ${AppInfo.versionName} (${AppInfo.buildNumber})`
    : 'Version unavailable';

const ProfileScreen = ({ navigation }) => {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets);
  useStatusBar(colors.primary);
  const toggleTheme = useToggleTheme();
  const isDark = useIsDark();
  const dispatch = useDispatch();
  const purchases = useSelector((state) => state.purchase.purchases || []);
  const collections = useSelector((state) => state.purchase.collections || []);
  const customCategories = useSelector((state) => state.user.customCategories || []);
  const user = useSelector((state) => state.user.user);
  const isGuestAccount = user?.isGuest === true;
  const profileHeaderTitle = isGuestAccount ? 'Guest account' : user?.email || 'Profile';
  const registrationDate =
    timestampToDate(user?.registrationDate) ||
    timestampToDate(auth().currentUser?.metadata?.creationTime);
  const memberSince = registrationDate
    ? new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(
        registrationDate
      )
    : 'Recently';
  const mostWornItem = purchases.reduce((mostWorn, item) => {
    const wearCount = item?.wears?.length || 0;
    const mostWornCount = mostWorn?.wears?.length || 0;

    return wearCount > mostWornCount ? item : mostWorn;
  }, null);

  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');
  const [upgradeError, setUpgradeError] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleSignOut = async () => {
    if (isGuestAccount) {
      setShowLogoutWarning(true);
      return;
    }

    auth().signOut();
  };

  const handleSendFeedback = () => {
    Linking.openURL(FEEDBACK_FORM_URL);
  };

  const confirmGuestSignOut = async () => {
    setShowLogoutWarning(false);
    await setGuestActive(false);
    dispatch(setUser(null));
    dispatch(setUserOnboarded(false));
  };

  const resetUpgradeForm = () => {
    setUpgradeEmail('');
    setUpgradePassword('');
    setUpgradeError(null);
  };

  const openUpgradeModal = () => {
    resetUpgradeForm();
    setShowUpgradeModal(true);
  };

  const closeUpgradeModal = () => {
    if (isUpgrading) return;

    setShowUpgradeModal(false);
    resetUpgradeForm();
  };

  const getUpgradeErrorMessage = (error) => {
    if (error?.code === 'auth/email-already-in-use') {
      return 'That email is already in use. Try signing in instead.';
    }
    if (error?.code === 'auth/invalid-email') {
      return 'Enter a valid email address.';
    }
    if (error?.code === 'auth/weak-password') {
      return 'Use a stronger password.';
    }
    if (error?.code === 'auth/provider-already-linked') {
      return 'This guest account is already linked to an email.';
    }
    if (error?.code === 'auth/credential-already-in-use') {
      return 'That email is already linked to another account.';
    }
    if (error?.code === 'auth/operation-not-allowed') {
      return 'Email accounts are not enabled for this Firebase project.';
    }

    return error?.message || 'Unable to create your account. Please try again.';
  };

  const handleCreateAccount = async () => {
    const trimmedEmail = upgradeEmail.trim().toLowerCase();

    if (!trimmedEmail || !upgradePassword) {
      setUpgradeError('Please fill in all fields.');
      return;
    }

    setIsUpgrading(true);
    setUpgradeError(null);

    try {
      const currentUser = auth().currentUser;
      const savedUser =
        currentUser ||
        (await auth().createUserWithEmailAndPassword(trimmedEmail, upgradePassword)).user;
      await setGuestPendingAuthUid(savedUser.uid);
      const userWithoutName = { ...user };
      delete userWithoutName.name;

      const updatedUser = {
        ...userWithoutName,
        email: trimmedEmail,
        isGuest: false,
        onboarded: true,
        upgradedAt: firestore.FieldValue.serverTimestamp(),
      };

      const userRef = firestore().collection('users').doc(savedUser.uid);
      const batch = firestore().batch();

      batch.set(
        userRef,
        {
          ...updatedUser,
          registrationDate: user?.registrationDate || firestore.FieldValue.serverTimestamp(),
          name: firestore.FieldValue.delete(),
        },
        { merge: true }
      );

      purchases.forEach((purchase) => {
        batch.set(userRef.collection('Purchases').doc(purchase.key), purchase);
      });
      collections.forEach((collection) => {
        batch.set(userRef.collection('Collections').doc(collection.id), collection);
      });
      customCategories.forEach((category) => {
        batch.set(userRef.collection('customCategories').doc(category.id), {
          category: category.category,
          subCategory: category.name,
        });
      });

      await batch.commit();
      dispatch(setUser({ ...updatedUser, upgradedAt: new Date().toISOString() }));
      await clearGuestData();
      setShowUpgradeModal(false);
      resetUpgradeForm();
    } catch (error) {
      setUpgradeError(getUpgradeErrorMessage(error));
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Modal transparent={true} visible={showUpgradeModal} onRequestClose={closeUpgradeModal}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create account</Text>

            {upgradeError && <Text style={styles.errorText}>{upgradeError}</Text>}

            <View style={styles.form}>
              <CustomInput
                label="Email"
                placeholder="example@gmail.com"
                value={upgradeEmail}
                onChangeText={setUpgradeEmail}
                type="email-address"
                autoCapitalize="none"
              />
              <CustomInput
                label="Password"
                placeholder="minimum 6 characters"
                value={upgradePassword}
                onChangeText={setUpgradePassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalButtons}>
              <CustomButton
                buttonStyle={styles.modalCancelButton}
                underlayColor="#777"
                onPress={closeUpgradeModal}
                title="Cancel"
                disabled={isUpgrading}
              />
              <CustomButton
                buttonStyle={styles.modalConfirmButton}
                onPress={handleCreateAccount}
                title={isUpgrading ? 'Saving...' : 'Save'}
                disabled={isUpgrading}
              />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmationModal
        visible={showLogoutWarning}
        title="Leave guest account?"
        message="Your guest data will stay on this device, but it is not backed up. Create an account to keep it safe across devices."
        confirmText="Leave"
        confirmButtonStyle={styles.logoutConfirmButton}
        onConfirm={confirmGuestSignOut}
        onCancel={() => setShowLogoutWarning(false)}
      />

      <Header title={profileHeaderTitle} titleStyle={styles.headerTitle} />

      <View style={styles.innerContainer}>
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={styles.statIcon}>
              <Ionicons name="calendar-outline" size={30} color={colors.primary} />
            </View>
            <Text style={styles.statLabel}>Member since</Text>
            <Text style={styles.amount}>{memberSince}</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.statIcon}>
              <Ionicons name="shirt-outline" size={30} color={colors.primary} />
            </View>
            <Text style={styles.statLabel}>Most worn</Text>
            <Text style={styles.amount} numberOfLines={1}>
              {mostWornItem?.name || 'No wears yet'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.sectionGroup}>
            <TouchableOpacity
              style={[styles.sectionRow, styles.rowDivider]}
              onPress={() => navigation.navigate('CustomCategory')}
            >
              <View style={styles.innerRowContainer}>
                <Ionicons
                  name="folder-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.rowIcon}
                />
                <Text style={styles.title}>Custom subcategories</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.gray} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sectionRow, styles.rowDivider]}
              onPress={() => navigation.getParent()?.navigate('Onboarding', { isReplay: true })}
              accessibilityRole="button"
              accessibilityLabel="Revisit onboarding"
            >
              <View style={styles.innerRowContainer}>
                <Ionicons
                  name="refresh-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.rowIcon}
                />
                <Text style={styles.title}>Revisit onboarding</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.gray} />
            </TouchableOpacity>

            <View style={styles.sectionRow}>
              <View style={styles.innerRowContainer}>
                <Ionicons
                  name={isDark ? 'moon' : 'sunny-outline'}
                  size={20}
                  color={colors.primary}
                  style={styles.rowIcon}
                />
                <Text style={styles.title}>Dark mode</Text>
              </View>
              <TouchableOpacity
                style={[styles.themeToggle, isDark ? styles.themeToggleOn : styles.themeToggleOff]}
                onPress={toggleTheme}
                activeOpacity={0.8}
                accessibilityRole="switch"
                accessibilityState={{ checked: isDark }}
              >
                <View style={[styles.themeToggleThumb, isDark && styles.themeToggleThumbOn]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback</Text>
          <View style={styles.sectionGroup}>
            <TouchableOpacity style={styles.sectionRow} onPress={handleSendFeedback}>
              <View style={styles.innerRowContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color={colors.primary}
                  style={styles.rowIcon}
                />
                <Text style={styles.title}>Send feedback</Text>
              </View>
              <Ionicons name="open-outline" size={20} color={colors.gray} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionGroup}>
            {isGuestAccount && (
              <TouchableOpacity
                style={[styles.sectionRow, styles.rowDivider]}
                onPress={openUpgradeModal}
              >
                <View style={styles.innerRowContainer}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={22}
                    color={colors.primary}
                    style={styles.rowIcon}
                  />
                  <Text style={styles.title}>Save this account</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray} />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.sectionRow} onPress={handleSignOut}>
              <View style={styles.innerRowContainer}>
                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color={isGuestAccount ? colors.red : colors.primary}
                  style={styles.rowIcon}
                />
                <Text style={[styles.title, isGuestAccount && styles.dangerText]}>
                  {isGuestAccount ? 'Leave guest session' : 'Log out'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray} />
            </TouchableOpacity>
          </View>
        </View>

        {/* <View style={styles.svgContainer}>
          <WomanSVG />
        </View> */}
        {appVersionText && <Text style={styles.versionText}>{appVersionText}</Text>}
      </View>
    </View>
  );
};

const createStyles = (colors, insets) =>
  StyleSheet.create({
    container: {
      height: '100%',
      width: '100%',
      backgroundColor: colors.bg,
    },
    innerContainer: {
      width: '100%',
      paddingHorizontal: 16,
      flex: 1,
    },
    versionText: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 74 + insets.bottom,
      color: colors.gray,
      fontSize: 12,
      textAlign: 'center',
      zIndex: 1,
    },
    headerTitle: {
      textAlign: 'center',
    },
    section: {
      marginTop: 10,
      gap: 6,
      marginHorizontal: -16,
    },
    sectionTitle: {
      color: colors.gray,
      fontSize: 13,
      marginBottom: 4,
      paddingHorizontal: 22,
    },
    sectionGroup: {
      backgroundColor: colors.white,
      overflow: 'hidden',
    },
    sectionRow: {
      minHeight: 52,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 22,
      paddingVertical: 8,
      backgroundColor: colors.white,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.bg,
    },
    logoutConfirmButton: {
      backgroundColor: colors.red,
    },
    dangerText: {
      color: colors.red,
      fontWeight: '600',
    },
    modalBackground: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      paddingHorizontal: 20,
    },
    modalContainer: {
      width: '100%',
      maxWidth: 360,
      padding: 20,
      backgroundColor: colors.white,
      borderRadius: 10,
    },
    modalTitle: {
      fontSize: 20,
      color: colors.black,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    form: {
      gap: 10,
    },
    errorText: {
      color: colors.red,
      textAlign: 'center',
      marginBottom: 10,
      lineHeight: 20,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 18,
    },
    modalCancelButton: {
      flex: 1,
      backgroundColor: colors.gray,
    },
    modalConfirmButton: {
      flex: 1,
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: 10,
      width: '48%',
      minHeight: 132,
      paddingHorizontal: 14,
      paddingVertical: 16,
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      elevation: 1,
    },
    amount: {
      maxWidth: '100%',
      color: colors.black,
      fontSize: 18,
      fontWeight: '600',
      marginTop: 2,
      textAlign: 'center',
    },
    statIcon: {
      width: 54,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statLabel: {
      color: colors.gray,
      fontSize: 13,
    },
    title: {
      color: colors.black,
      fontSize: 15,
    },
    cardContainer: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    scrollViewContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    innerRowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    rowIcon: {
      marginRight: 12,
    },
    themeToggle: {
      width: 38,
      height: 20,
      borderRadius: 10,
      padding: 2,
      justifyContent: 'center',
    },
    themeToggleOff: {
      backgroundColor: colors.primaryLight,
    },
    themeToggleOn: {
      backgroundColor: colors.primaryLight,
    },
    themeToggleThumb: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.white,
      elevation: 2,
    },
    themeToggleThumbOn: {
      backgroundColor: colors.primary,
      transform: [{ translateX: 18 }],
    },
    svgContainer: {
      alignItems: 'center',
      position: 'absolute',
      bottom: 56,
      width: '100%',
    },
  });

export default ProfileScreen;
