import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../../contexts/AppContext';

const PHRASES = [
  { hindi: 'नमस्ते', pronunciation: 'Namaste', english: 'Hello / Greetings', category: 'Greetings' },
  { hindi: 'कैसे हो?', pronunciation: 'Kaise ho?', english: 'How are you? (informal)', category: 'Greetings' },
  { hindi: 'मैं ठीक हूँ', pronunciation: 'Main theek hoon', english: 'I am fine', category: 'Greetings' },
  { hindi: 'धन्यवाद', pronunciation: 'Dhanyavaad', english: 'Thank you', category: 'Greetings' },
  { hindi: 'माफ कीजिए', pronunciation: 'Maaf kijiye', english: 'I am sorry / Excuse me', category: 'Greetings' },
  { hindi: 'शुक्रिया', pronunciation: 'Shukriya', english: 'Thank you (informal)', category: 'Greetings' },
  { hindi: 'अलविदा', pronunciation: 'Alvida', english: 'Goodbye', category: 'Greetings' },
  { hindi: 'फिर मिलेंगे', pronunciation: 'Phir milenge', english: 'See you again', category: 'Greetings' },

  { hindi: 'यह क्या है?', pronunciation: 'Yeh kya hai?', english: 'What is this?', category: 'Questions' },
  { hindi: 'आपका नाम क्या है?', pronunciation: 'Aapka naam kya hai?', english: 'What is your name?', category: 'Questions' },
  { hindi: 'मेरा नाम ___ है', pronunciation: 'Mera naam ___ hai', english: 'My name is ___', category: 'Questions' },
  { hindi: 'यह कहाँ है?', pronunciation: 'Yeh kahan hai?', english: 'Where is this?', category: 'Questions' },
  { hindi: 'कितने का है?', pronunciation: 'Kitne ka hai?', english: 'How much does it cost?', category: 'Questions' },
  { hindi: 'क्या आप हिंदी जानते हैं?', pronunciation: 'Kya aap Hindi jaante hain?', english: 'Do you know Hindi?', category: 'Questions' },

  { hindi: 'मुझे पानी चाहिए', pronunciation: 'Mujhe paani chahiye', english: 'I need water', category: 'Daily Life' },
  { hindi: 'खाना कब मिलेगा?', pronunciation: 'Khaana kab milega?', english: 'When will food be ready?', category: 'Daily Life' },
  { hindi: 'अस्पताल कहाँ है?', pronunciation: 'Aspataal kahan hai?', english: 'Where is the hospital?', category: 'Daily Life' },
  { hindi: 'बाज़ार कितनी दूर है?', pronunciation: 'Bazaar kitni door hai?', english: 'How far is the market?', category: 'Daily Life' },
  { hindi: 'मुझे मदद चाहिए', pronunciation: 'Mujhe madad chahiye', english: 'I need help', category: 'Daily Life' },
  { hindi: 'मैं नहीं समझा', pronunciation: 'Main nahin samjha', english: 'I did not understand', category: 'Daily Life' },
  { hindi: 'धीरे बोलिए', pronunciation: 'Dheere boliye', english: 'Please speak slowly', category: 'Daily Life' },
];

const GRAMMAR_TIPS = [
  {
    icon: 'git-branch-outline' as const,
    title: 'No Articles',
    body: 'Hindi has no "a", "an" or "the". "kitaab" can mean "a book" or "the book" — context decides.',
  },
  {
    icon: 'swap-horizontal-outline' as const,
    title: 'Verb at the End',
    body: 'Hindi is Subject-Object-Verb (SOV). Say "Main khaana khaata hoon" (I food eat) not "I eat food".',
  },
  {
    icon: 'male-female-outline' as const,
    title: 'Grammatical Gender',
    body: 'Every noun is masculine or feminine. This affects adjectives and verbs. Ladka (boy) is masculine, Ladki (girl) is feminine.',
  },
  {
    icon: 'layers-outline' as const,
    title: 'Postpositions',
    body: 'Hindi uses postpositions (after the noun) instead of prepositions. "ghar mein" = "in house", not "in the house".',
  },
  {
    icon: 'people-outline' as const,
    title: 'Three "You"s',
    body: '"Tu" is very informal, "Tum" is casual, "Aap" is formal/respectful. Always use "Aap" with elders and strangers.',
  },
  {
    icon: 'time-outline' as const,
    title: 'Tense with Auxiliary',
    body: 'Tense is shown by helping verbs. "Jaata hoon" = go (present), "Gaya tha" = had gone (past perfect).',
  },
];

const CULTURAL_TIPS = [
  { emoji: '🙏', title: 'Namaste', body: 'Joining palms while saying Namaste shows respect. It also works as both hello and goodbye.' },
  { emoji: '🍽️', title: 'Eating Etiquette', body: 'Offering food is a sign of hospitality. Saying "Khana khaya?" (Have you eaten?) is a common greeting.' },
  { emoji: '👴', title: 'Respect for Elders', body: 'Add "-ji" after a name to show respect: "Ramesji". Never call elders by their first name alone.' },
  { emoji: '🎉', title: 'Festivals', body: '"Shubh Diwali!" (Happy Diwali), "Eid Mubarak!" — learning festival greetings wins hearts quickly.' },
  { emoji: '🤝', title: 'Hospitality', body: '"Atithi Devo Bhava" — Guest is God. Indians take hospitality seriously; refusing food can seem impolite.' },
];

type Category = 'Greetings' | 'Questions' | 'Daily Life' | 'All';

export default function ExploreScreen() {
  const { state } = useAppContext();
  const { darkMode } = state;
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [expandedTip, setExpandedTip] = useState<number | null>(null);

  const bg = (light: string, dark: string) => (darkMode ? dark : light);

  const categories: Category[] = ['All', 'Greetings', 'Questions', 'Daily Life'];

  const filteredPhrases = activeCategory === 'All'
    ? PHRASES
    : PHRASES.filter(p => p.category === activeCategory);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: bg('#F0F4F8', '#111827') }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={[styles.pageTitle, { color: bg('#1F2937', '#F9FAFB') }]}>Explore</Text>
        <Text style={[styles.pageSub, { color: bg('#6B7280', '#9CA3AF') }]}>
          Phrases, grammar tips & culture
        </Text>
      </View>

      {/* Common Phrases */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: bg('#1F2937', '#F9FAFB') }]}>Common Phrases</Text>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                {
                  backgroundColor: activeCategory === cat ? '#4F46E5' : bg('#E5E7EB', '#374151'),
                },
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.filterChipText, { color: activeCategory === cat ? '#fff' : bg('#374151', '#D1D5DB') }]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredPhrases.map((phrase, i) => (
          <View key={i} style={[styles.phraseCard, { backgroundColor: bg('#FFFFFF', '#1F2937') }]}>
            <Text style={[styles.hindiText, { color: bg('#1F2937', '#F9FAFB') }]}>{phrase.hindi}</Text>
            <Text style={[styles.pronunciationText, { color: bg('#4F46E5', '#A78BFA') }]}>{phrase.pronunciation}</Text>
            <Text style={[styles.englishText, { color: bg('#6B7280', '#9CA3AF') }]}>{phrase.english}</Text>
            <View style={[styles.categoryTag, { backgroundColor: bg('#EEF2FF', '#312E81') }]}>
              <Text style={[styles.categoryTagText, { color: bg('#4F46E5', '#A78BFA') }]}>{phrase.category}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Grammar Tips */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: bg('#1F2937', '#F9FAFB') }]}>Grammar Tips</Text>
        {GRAMMAR_TIPS.map((tip, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.tipCard, { backgroundColor: bg('#FFFFFF', '#1F2937') }]}
            onPress={() => setExpandedTip(expandedTip === i ? null : i)}
            activeOpacity={0.8}
          >
            <View style={styles.tipHeader}>
              <View style={[styles.tipIconCircle, { backgroundColor: bg('#EEF2FF', '#312E81') }]}>
                <Ionicons name={tip.icon} size={20} color={bg('#4F46E5', '#A78BFA')} />
              </View>
              <Text style={[styles.tipTitle, { color: bg('#1F2937', '#F9FAFB') }]}>{tip.title}</Text>
              <Ionicons
                name={expandedTip === i ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={bg('#9CA3AF', '#6B7280')}
              />
            </View>
            {expandedTip === i && (
              <Text style={[styles.tipBody, { color: bg('#4B5563', '#D1D5DB') }]}>{tip.body}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Cultural Tips */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: bg('#1F2937', '#F9FAFB') }]}>Culture & Context</Text>
        {CULTURAL_TIPS.map((tip, i) => (
          <View key={i} style={[styles.cultureCard, { backgroundColor: bg('#FFFFFF', '#1F2937') }]}>
            <Text style={styles.cultureEmoji}>{tip.emoji}</Text>
            <View style={styles.cultureText}>
              <Text style={[styles.cultureTitle, { color: bg('#1F2937', '#F9FAFB') }]}>{tip.title}</Text>
              <Text style={[styles.cultureBody, { color: bg('#6B7280', '#9CA3AF') }]}>{tip.body}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Learning Tip Banner */}
      <View style={[styles.banner, { backgroundColor: bg('#EEF2FF', '#1E1B4B') }]}>
        <Ionicons name="bulb-outline" size={24} color={bg('#4F46E5', '#A78BFA')} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.bannerTitle, { color: bg('#4F46E5', '#A78BFA') }]}>Pro Tip</Text>
          <Text style={[styles.bannerBody, { color: bg('#374151', '#C4B5FD') }]}>
            Study 10–15 minutes daily with the flashcards. Consistency beats marathon sessions every time.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  headerSection: { marginBottom: 24, marginTop: 12 },
  pageTitle: { fontSize: 28, fontWeight: 'bold' },
  pageSub: { fontSize: 14, marginTop: 4 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  filterRow: { marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipText: { fontSize: 13, fontWeight: '500' },
  phraseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  hindiText: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  pronunciationText: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  englishText: { fontSize: 14, marginBottom: 8 },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryTagText: { fontSize: 11, fontWeight: '600' },
  tipCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
  tipBody: { fontSize: 14, lineHeight: 21, marginTop: 12 },
  cultureCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  cultureEmoji: { fontSize: 28, marginTop: 2 },
  cultureText: { flex: 1 },
  cultureTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  cultureBody: { fontSize: 14, lineHeight: 20 },
  banner: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  bannerTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  bannerBody: { fontSize: 13, lineHeight: 19 },
});
