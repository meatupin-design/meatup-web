import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TrendingUp,
  TrendingDown,
  Mail,
  Phone,
  MapPin,
  Edit2,
  ChevronLeft,
  LogOut,
  LogIn,
  Plus,
  Trash2,
  PlusCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import StatusBanner from '@/components/StatusBanner';

export default function ProfileScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 1024;
  const contentMaxWidth = 1100;

  const router = useRouter();
  const { user, walletHistory, updateUserProfile, addAddress, removeAddress } = useApp();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);

  // Address Form State
  const [showAddressForm, setShowAddressForm] = React.useState(false);
  const [newAddrLabel, setNewAddrLabel] = React.useState('Home');
  const [newAddrDetails, setNewAddrDetails] = React.useState('');

  // Edit State
  const [editName, setEditName] = React.useState(user.name);
  const [editPhone, setEditPhone] = React.useState(user.phone);
  const [editAddress, setEditAddress] = React.useState(user.address || '');

  // Banner State
  const [bannerVisible, setBannerVisible] = React.useState(false);
  const [bannerType, setBannerType] = React.useState<'success' | 'error'>('success');
  const [bannerMessage, setBannerMessage] = React.useState('');

  React.useEffect(() => {
    setEditName(user.name);
    setEditPhone(user.phone);
    setEditAddress(user.address || '');
  }, [user]);

  const isGuest = user.id === '1' || !user.email;

  const handleLogout = async () => {
    try {
      await logout(true); // Silent logout
      showBanner('success', 'Logged out successfully');
      setTimeout(() => {
        router.replace('/');
      }, 1500);
    } catch (e) {
      showBanner('error', 'Failed to log out.');
    }
  };

  const showBanner = (type: 'success' | 'error', message: string) => {
    setBannerType(type);
    setBannerMessage(message);
    setBannerVisible(true);
  };

  const handleSaveProfile = async () => {
    await updateUserProfile({
      name: editName,
      phone: editPhone,
      address: editAddress,
    });
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
      : 'G';
  };

  if (isEditing) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerBg, { paddingTop: insets.top }]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.backButton}>
              <ChevronLeft size={28} color={Colors.cream} />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Edit Profile</Text>
            <View style={{ width: 28 }} />
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.editForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                placeholder="Enter phone number"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                value={editAddress}
                onChangeText={setEditAddress}
                multiline
                placeholder="Enter delivery address"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header Section */}
      <StatusBanner
        visible={bannerVisible}
        type={bannerType}
        message={bannerMessage}
        onClose={() => setBannerVisible(false)}
      />
      <View style={[styles.headerBg, { paddingTop: insets.top }]}>
        <View style={{ maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }}>
          <View style={styles.headerTopRow}>
            <Text style={styles.screenTitle}>Profile</Text>
            {!isGuest && (
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <LogOut size={24} color={Colors.cream} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.profileHeaderContent}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>

            {isGuest ? (
              <TouchableOpacity style={styles.signInPill} onPress={() => router.push('/login')}>
                <LogIn size={16} color={Colors.deepTeal} />
                <Text style={styles.signInText}>Sign In / Sign Up</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.editProfilePill} onPress={() => setIsEditing(true)}>
                <Edit2 size={12} color={Colors.white} />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={isDesktop ? styles.rowLayout : null}>
          <View style={isDesktop ? styles.leftColumn : null}>
            {/* Membership Card */}
            <View style={styles.membershipCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardLabel}>Member Card</Text>
                  <Text style={styles.cardPoints}>{user.wallet_points}</Text>
                  <Text style={styles.cardPointsLabel}>Meat Points</Text>
                </View>
                <View style={styles.cardIconContainer}>
                  <Image source={require('../../assets/images/cp-profile.png')} style={styles.cardIcon} resizeMode="contain" />
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>1 Point = ₹1 • Redeemable at checkout</Text>
              </View>
            </View>
          </View>

          <View style={isDesktop ? styles.rightColumn : null}>
            {/* Contact Info Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.iconCircle}>
                    <Mail size={18} color={Colors.deepTeal} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{user.email}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.iconCircle}>
                    <Phone size={18} color={Colors.deepTeal} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{user.phone || 'Add phone number'}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.iconCircle}>
                    <MapPin size={18} color={Colors.deepTeal} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Address</Text>
                    <Text style={styles.infoValue} numberOfLines={2}>
                      {user.address || 'Add delivery address'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* My Addresses Section */}
            {!isGuest && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>My Addresses</Text>
                  <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={() => setShowAddressForm(!showAddressForm)}
                  >
                    <Plus size={18} color={Colors.deepTeal} />
                  </TouchableOpacity>
                </View>

                {showAddressForm && (
                  <View style={styles.addressForm}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.miniLabel}>Label (e.g. Home, Work)</Text>
                      <TextInput
                        style={styles.miniInput}
                        value={newAddrLabel}
                        onChangeText={setNewAddrLabel}
                        placeholder="Home"
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.miniLabel}>Full Address</Text>
                      <TextInput
                        style={[styles.miniInput, { height: 80, textAlignVertical: 'top' }]}
                        value={newAddrDetails}
                        onChangeText={setNewAddrDetails}
                        multiline
                        placeholder="House No, Street, Landmark..."
                      />
                    </View>
                    <TouchableOpacity 
                      style={styles.confirmAddBtn}
                      onPress={async () => {
                        if (newAddrDetails.trim()) {
                          await addAddress(newAddrLabel, newAddrDetails);
                          setNewAddrDetails('');
                          setShowAddressForm(false);
                        }
                      }}
                    >
                      <Text style={styles.confirmAddBtnText}>Add Address</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.infoCard}>
                  {(() => {
                    const displayAddresses = [
                      ...(user.address ? [{ id: 'primary', label: 'Primary', details: user.address }] : []),
                      ...(user.addresses || [])
                    ].filter((v, i, a) => a.findIndex(t => t.details === v.details) === i);

                    if (displayAddresses.length > 0) {
                      return displayAddresses.map((addr, idx) => (
                        <View key={addr.id}>
                          <View style={styles.addressRow}>
                            <View style={styles.addressIconBg}>
                              <MapPin size={18} color={Colors.deepTeal} />
                            </View>
                            <View style={styles.addressInfo}>
                              <Text style={styles.addressLabel}>{addr.label}</Text>
                              <Text style={styles.addressDetails}>{addr.details}</Text>
                            </View>
                            {addr.id !== 'primary' && (
                              <TouchableOpacity 
                                onPress={() => removeAddress(addr.id)}
                                style={styles.deleteAddrBtn}
                              >
                                <Trash2 size={18} color={Colors.priceDown} />
                              </TouchableOpacity>
                            )}
                          </View>
                          {idx < displayAddresses.length - 1 && <View style={styles.divider} />}
                        </View>
                      ));
                    }
                    return <Text style={styles.emptyText}>No addresses added yet.</Text>
                  })()}
                </View>
              </View>
            )}

            {/* Transaction History */}
            {walletHistory.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <View style={styles.infoCard}>
                  {walletHistory.map((t, index) => (
                    <View key={t.id}>
                      <View style={styles.historyItem}>
                        <View
                          style={[
                            styles.historyIcon,
                            { backgroundColor: t.type === 'earned' ? Colors.priceUp + '15' : Colors.priceDown + '15' },
                          ]}
                        >
                          {t.type === 'earned' ? (
                            <TrendingUp size={18} color={Colors.priceUp} />
                          ) : (
                            <TrendingDown size={18} color={Colors.priceDown} />
                          )}
                        </View>
                        <View style={styles.historyContent}>
                          <Text style={styles.historyDesc}>{t.description}</Text>
                          <Text style={styles.historyDate}>
                            {new Date(t.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.historyAmount,
                            { color: t.type === 'earned' ? Colors.priceUp : Colors.priceDown },
                          ]}
                        >
                          {t.type === 'earned' ? '+' : '-'}
                          {t.amount}
                        </Text>
                      </View>
                      {index < walletHistory.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.footerContact}>
          <Text style={styles.footerContactText}>Contact: +918281626692</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcffe5ff', // Slightly grey background for content contrast
  },
  headerBg: {
    backgroundColor: Colors.deepTeal,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 40,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.cream,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  profileHeaderContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.deepTeal,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.creamLight,
    marginBottom: 16,
    opacity: 0.8,
  },
  editProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  signInPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  signInText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.deepTeal,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  membershipCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    marginTop: -40, // Overlap with header
    marginBottom: 24,
    shadowColor: Colors.deepTeal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.deepTeal,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    opacity: 0.7,
  },
  cardPoints: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.deepTeal,
    lineHeight: 48,
  },
  cardPointsLabel: {
    fontSize: 14,
    color: Colors.deepTeal,
    fontWeight: '500',
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: Colors.orange.substring(0, 7) + '10', // Light orange bg
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    width: 30,
    height: 30,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  cardFooterText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: 12,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.deepTeal.substring(0, 7) + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: Colors.charcoal,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 12,
    marginLeft: 56, // Align with text start
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  historyContent: {
    flex: 1,
  },
  historyDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  editForm: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.charcoal,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.charcoal,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  saveButton: {
    backgroundColor: Colors.deepTeal,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: Colors.deepTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestLoginButton: {
    backgroundColor: Colors.orange,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  guestLoginText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  rowLayout: {
    flexDirection: 'row',
    gap: 24,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1.8,
  },
  footerContact: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    opacity: 0.6,
  },
  footerContactText: {
    fontSize: 13,
    color: Colors.deepTeal,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.deepTeal.substring(0, 7) + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressForm: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.deepTeal.substring(0, 7) + '20',
  },
  miniLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    fontWeight: '600',
  },
  miniInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.charcoal,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  confirmAddBtn: {
    backgroundColor: Colors.deepTeal,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmAddBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  addressIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: 2,
  },
  addressDetails: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  deleteAddrBtn: {
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 20,
  },
});
