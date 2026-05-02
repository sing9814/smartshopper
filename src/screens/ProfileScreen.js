import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CustomButton from '../components/button';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useTheme, useToggleTheme, useIsDark } from '../theme/themeContext';
import WomanSVG from '../../assets/womanSVG';
import PigSVG from '../../assets/pigSVG';
import MoneySVG from '../../assets/moneySVG';
import Header from '../components/header';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useStatusBar } from '../hooks/useStatusBar';
import ConfirmationModal from '../components/confirmationModal';
import CustomInput from '../components/customInput';
import { setUser } from '../redux/actions/userActions';

const ProfileScreen = ({ navigation }) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  useStatusBar(colors.primary);
  const toggleTheme = useToggleTheme();
  const isDark = useIsDark();
  const dispatch = useDispatch();
  const purchaseData = useSelector((state) => state.purchase.purchases);
  const user = useSelector((state) => state.user.user);
  const isGuestAccount = user?.isGuest || auth().currentUser?.isAnonymous;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeName, setUpgradeName] = useState(user?.name === 'Guest' ? '' : user?.name || '');
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');
  const [upgradeError, setUpgradeError] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    let spent = 0;
    let saved = 0;

    purchaseData.forEach((purchase) => {
      const regularPrice = parseInt(purchase.regularPrice, 10) || 0;
      const paidPrice = parseInt(purchase.paidPrice, 10);

      spent += paidPrice;

      if (paidPrice < regularPrice) {
        saved += regularPrice - paidPrice;
      }
    });

    setTotalSpent((spent / 100).toFixed(2));
    setTotalSaved((saved / 100).toFixed(2));

    setLoading(false);
  };

  const handleSignOut = async () => {
    if (isGuestAccount) {
      setShowLogoutWarning(true);
      return;
    }

    auth().signOut();
  };

  const confirmGuestSignOut = () => {
    setShowLogoutWarning(false);
    auth().signOut();
  };

  const resetUpgradeForm = () => {
    setUpgradeName(user?.name === 'Guest' ? '' : user?.name || '');
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
    const trimmedName = upgradeName.trim();
    const trimmedEmail = upgradeEmail.trim();

    if (!trimmedName || !trimmedEmail || !upgradePassword) {
      setUpgradeError('Please fill in all fields.');
      return;
    }

    setIsUpgrading(true);
    setUpgradeError(null);

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        setUpgradeError('Please sign in again before creating an account.');
        return;
      }

      const credential = auth.EmailAuthProvider.credential(trimmedEmail, upgradePassword);
      const userCredential = await currentUser.linkWithCredential(credential);
      const updatedUser = {
        ...user,
        name: trimmedName,
        email: trimmedEmail,
        isGuest: false,
        upgradedAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore().collection('users').doc(userCredential.user.uid).update(updatedUser);
      dispatch(setUser({ ...updatedUser, upgradedAt: new Date().toISOString() }));
      setShowUpgradeModal(false);
      resetUpgradeForm();
    } catch (error) {
      setUpgradeError(getUpgradeErrorMessage(error));
    } finally {
      setIsUpgrading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [purchaseData]);

  return (
    <View style={styles.container}>
      <Modal transparent={true} visible={showUpgradeModal} onRequestClose={closeUpgradeModal}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create account</Text>
            <Text style={styles.modalText}>Add an email and password to keep your items safe.</Text>

            {upgradeError && <Text style={styles.errorText}>{upgradeError}</Text>}

            <View style={styles.form}>
              <CustomInput label="Name" value={upgradeName} onChangeText={setUpgradeName} />
              <CustomInput
                label="Email"
                value={upgradeEmail}
                onChangeText={setUpgradeEmail}
                type="email-address"
                autoCapitalize="none"
              />
              <CustomInput
                label="Password"
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
        message="If you leave, you will not be able to return to this guest account later. Create an account first if you want to keep your data."
        confirmText="Leave"
        confirmButtonStyle={styles.logoutConfirmButton}
        onConfirm={confirmGuestSignOut}
        onCancel={() => setShowLogoutWarning(false)}
      />

      <Header
        title={user?.name || ' '}
        subtitle={isGuestAccount ? 'Guest account' : user?.email || ' '}
        rounded
        padding
      />

      <View style={styles.innerContainer}>
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={styles.statIcon}>
              <MoneySVG color={colors.secondary} size={44} />
            </View>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={[styles.amount, styles.spentAmount]}>${totalSpent}</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.statIcon}>
              <PigSVG color={colors.green} size={44} />
            </View>
            <Text style={styles.statLabel}>Saved</Text>
            <Text style={[styles.amount, styles.savedAmount]}>${totalSaved}</Text>
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
                  size={22}
                  color={colors.primary}
                  style={styles.rowIcon}
                />
                <Text style={styles.title}>Manage categories</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray} />
            </TouchableOpacity>

            <View style={styles.sectionRow}>
              <View style={styles.innerRowContainer}>
                <Ionicons
                  name={isDark ? 'moon' : 'sunny-outline'}
                  size={22}
                  color={colors.primary}
                  style={styles.rowIcon}
                />
                <Text style={styles.title}>Dark mode</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.themeToggle,
                  isDark ? styles.themeToggleOn : styles.themeToggleOff,
                ]}
                onPress={toggleTheme}
                activeOpacity={0.8}
                accessibilityRole="switch"
                accessibilityState={{ checked: isDark }}
              >
                <View
                  style={[
                    styles.themeToggleThumb,
                    isDark && styles.themeToggleThumbOn,
                  ]}
                />
              </TouchableOpacity>
            </View>
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
      </View>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      height: '100%',
      width: '100%',
      backgroundColor: colors.bg,
    },
    innerContainer: {
      width: '100%',
      paddingHorizontal: 12,
      flex: 1,
    },
    section: {
      marginTop: 12,
      marginHorizontal: 12,
      gap: 6,
    },
    sectionTitle: {
      color: colors.gray,
      marginBottom: 2,
    },
    sectionGroup: {
      backgroundColor: colors.white,
      borderRadius: 10,
      overflow: 'hidden',
      elevation: 1,
    },
    sectionRow: {
      minHeight: 52,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
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
    modalText: {
      color: colors.gray,
      lineHeight: 22,
      textAlign: 'center',
      marginBottom: 14,
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
      width: '47%',
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
      color: colors.black,
      fontSize: 20,
      fontWeight: '700',
      marginTop: 2,
    },
    spentAmount: {
      color: colors.secondary,
    },
    savedAmount: {
      color: colors.green,
    },
    statIcon: {
      width: 54,
      height: 54,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statLabel: {
      color: colors.gray,
      fontSize: 13,
      fontWeight: '500',
    },
    title: {
      color: colors.black,
      fontSize: 16,
    },
    cardContainer: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
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
