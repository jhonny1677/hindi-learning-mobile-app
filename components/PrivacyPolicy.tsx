import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../contexts/AppContext';

interface PrivacyPolicyProps {
  visible: boolean;
  onClose: () => void;
  mode?: 'privacy' | 'terms';
}

export default function PrivacyPolicy({ visible, onClose, mode = 'privacy' }: PrivacyPolicyProps) {
  const { state } = useAppContext();
  const { darkMode } = state;
  const bg = (light: string, dark: string) => (darkMode ? dark : light);

  const isPrivacy = mode === 'privacy';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: bg('#F9FAFB', '#111827') }]}>
        <View style={[styles.header, { backgroundColor: bg('#FFFFFF', '#1F2937'), borderBottomColor: bg('#E5E7EB', '#4B5563') }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={bg('#374151', '#D1D5DB')} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: bg('#1F2937', '#F9FAFB') }]}>
            {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.updated, { color: bg('#6B7280', '#9CA3AF') }]}>
            Last updated: May 2025
          </Text>

          {isPrivacy ? (
            <>
              <Section title="Overview" dark={darkMode}>
                Seekho Hindi ("the App") is a language learning app built to help you learn Hindi vocabulary.
                We are committed to protecting your privacy. This policy explains what data the App stores
                and how it is used.
              </Section>

              <Section title="Data We Collect" dark={darkMode}>
                The App stores the following data <Text style={styles.bold}>only on your device</Text>:{'\n\n'}
                • Your name and email address (if you create an account){'\n'}
                • Your learning progress and quiz scores{'\n'}
                • Streak, XP, badges, and quest progress{'\n'}
                • App preferences (dark mode, difficulty level){'\n\n'}
                This data is stored using your device's local storage (AsyncStorage). It never leaves your
                device unless you explicitly back it up.
              </Section>

              <Section title="Data We Do NOT Collect" dark={darkMode}>
                We do <Text style={styles.bold}>not</Text> collect:{'\n\n'}
                • Any payment or financial information{'\n'}
                • Location data{'\n'}
                • Device contacts or media{'\n'}
                • Analytics or usage tracking data sent to external servers{'\n'}
                • Advertising identifiers
              </Section>

              <Section title="Account Passwords" dark={darkMode}>
                If you create an account, your password is hashed (SHA-256) before being stored locally.
                We never store your password in plain text, and it is never transmitted over the network.
              </Section>

              <Section title="Third-Party Services" dark={darkMode}>
                The App does not integrate with any third-party analytics, advertising, or data collection
                services. Text-to-speech is provided by the device's built-in speech engine (no data is
                sent to external servers).
              </Section>

              <Section title="Data Deletion" dark={darkMode}>
                You can delete all app data at any time using the "Reset All Progress" button on the home
                screen, or by uninstalling the app. This permanently removes all locally stored data.
              </Section>

              <Section title="Children's Privacy" dark={darkMode}>
                The App is suitable for all ages. We do not knowingly collect personal information from
                children. Since all data stays on-device, there is no special risk to children's data.
              </Section>

              <Section title="Changes to This Policy" dark={darkMode}>
                We may update this Privacy Policy from time to time. Changes will be reflected in a new
                version of the app on the Play Store, with an updated "last updated" date.
              </Section>

              <Section title="Contact" dark={darkMode}>
                If you have any questions about this Privacy Policy, please contact us at:{'\n'}
                ankit.acoolguy@gmail.com
              </Section>
            </>
          ) : (
            <>
              <Section title="Acceptance" dark={darkMode}>
                By downloading and using Seekho Hindi, you agree to these Terms of Service. If you do not
                agree, please do not use the App.
              </Section>

              <Section title="Use of the App" dark={darkMode}>
                Seekho Hindi is a personal learning tool. You may use it for your own educational
                purposes. You may not:{'\n\n'}
                • Reverse engineer, modify, or redistribute the App{'\n'}
                • Use the App for any unlawful purpose{'\n'}
                • Attempt to extract or copy our word database for commercial use
              </Section>

              <Section title="User Accounts" dark={darkMode}>
                Accounts are stored locally on your device. You are responsible for keeping your password
                safe. We cannot recover lost passwords since all data is on-device only.
              </Section>

              <Section title="Content" dark={darkMode}>
                The Hindi vocabulary and content in the App is provided for educational purposes. While
                we strive for accuracy, we make no guarantee that all translations or pronunciations are
                perfect. Please use additional references for formal study.
              </Section>

              <Section title="Disclaimer" dark={darkMode}>
                The App is provided "as is" without warranties of any kind. We are not liable for any
                loss of learning progress or data resulting from app uninstallation, device loss, or bugs.
              </Section>

              <Section title="Changes" dark={darkMode}>
                We reserve the right to update these Terms at any time. Continued use of the App after
                changes constitutes acceptance of the new terms.
              </Section>

              <Section title="Contact" dark={darkMode}>
                Questions about these Terms? Contact us at:{'\n'}
                ankit.acoolguy@gmail.com
              </Section>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function Section({ title, children, dark }: { title: string; children: React.ReactNode; dark: boolean }) {
  const bg = (light: string, d: string) => (dark ? d : light);
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: bg('#1F2937', '#F9FAFB') }]}>{title}</Text>
      <Text style={[styles.sectionBody, { color: bg('#4B5563', '#D1D5DB') }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { padding: 20, paddingBottom: 40 },
  updated: { fontSize: 12, marginBottom: 20, fontStyle: 'italic' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  sectionBody: { fontSize: 14, lineHeight: 22 },
  bold: { fontWeight: '700' },
});
