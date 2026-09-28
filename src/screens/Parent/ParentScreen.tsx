import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Screen } from '../../components/Screen/Screen';
import { SoftButton } from '../../components/SoftButton/SoftButton';
import { cardSurface, radius, spacing, textStyles, ui } from '../../theme';

interface ParentScreenProps {
  onBack: () => void;
}

/**
 * Parent mode — a placeholder with real structure, not a dashboard.
 *
 * This is intentionally the least finished screen in the app, because a
 * learning history is only meaningful once there is enough learning to have a
 * history of. Building the dashboard now would mean designing charts around
 * data we have not collected yet.
 *
 * What exists today: the engine already records attempts per step in
 * `LessonState.attempts`. Wiring that through `src/storage/progress.ts` is
 * what turns the sections below into real content.
 *
 * Note the visual tone is deliberately different from the child's side —
 * smaller text, denser layout, more words. It should feel like a different
 * room, so a parent knows at a glance which side of the app they are on.
 */
export function ParentScreen({ onBack }: ParentScreenProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  return (
    <Screen>
      <View style={[styles.header, isTablet && styles.tabletHeader]}>
        <Eyebrow label="FOR PARENTS" variant="header" />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          isTablet ? styles.tabletContent : styles.mobileContent,
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <Eyebrow label="A GENTLE GUIDE" />
          <Text style={styles.intro}>
            This app is built to be used alongside your child, not instead of you.
            It teaches one idea at a time, waits as long as your child needs, and
            never rewards speed. It was built to be very low stimulant, focusing on
            the core concepts rather than bright colors and overstimulating sound effects.
            you will be able to record your voice going through the modules while following
            the provided captions. This is for those longer days when time can't be allocated.
            this was wasn't designed to replace physical toys and books, but to provide a more
            convenient alternative when toys and books arent suited for the environment.
            You are their greatest teacher always remember that.
          </Text>
        </View>

        <View style={styles.sections}>
          <Eyebrow label="LEARNING OVERVIEW" />
          <PlaceholderSection
            title="Concepts introduced"
            description="Which ideas your child has seen for the first time."
          />
          <PlaceholderSection
            title="Concepts practised"
            description="Ideas revisited, and how often."
          />
          <PlaceholderSection
            title="Needing review"
            description="Ideas that took several tries, suggested for another look."
          />
          <PlaceholderSection
            title="Learning history"
            description="A simple record over time. No scores and no comparisons."
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <SoftButton label="Back" onPress={onBack} />
      </View>
    </Screen>
  );
}

interface PlaceholderSectionProps {
  title: string;
  description: string;
}

interface EyebrowProps {
  label: string;
  variant?: 'header';
}

function Eyebrow({ label, variant }: EyebrowProps) {
  return (
    <View style={styles.eyebrow}>
      <View style={[styles.eyebrowRule, variant === 'header' && styles.headerRule]} />
      <Text style={[styles.eyebrowLabel, variant === 'header' && styles.headerLabel]}>
        {label}
      </Text>
    </View>
  );
}

function PlaceholderSection({ title, description }: PlaceholderSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
      <Text style={styles.sectionPending}>Not yet recorded</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: spacing.xl + 21,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 2,
    minHeight: 70 + spacing.md + spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    ...cardSurface,
  },
  tabletHeader: {
    top: spacing.xl,
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  mobileContent: {
    paddingTop: 170,
  },
  tabletContent: {
    maxWidth: 720,
    paddingTop: 150,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  eyebrowRule: {
    width: 44,
    height: 1,
    backgroundColor: ui.warmBrown,
  },
  headerRule: {
    width: 80,
  },
  eyebrowLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 3,
    color: ui.warmBrown,
  },
  headerLabel: {
    fontSize: 20,
    letterSpacing: 5,
  },
  intro: {
    ...textStyles.caption,
    color: ui.inkSoft,
    lineHeight: 26,
  },
  introCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.md,
    ...cardSurface,
  },
  sections: {
    gap: spacing.md,
  },
  section: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.xs,
    ...cardSurface,
  },
  sectionTitle: {
    ...textStyles.body,
    color: ui.ink,
  },
  sectionDescription: {
    ...textStyles.caption,
    color: ui.inkSoft,
  },
  sectionPending: {
    ...textStyles.caption,
    color: ui.border,
    paddingTop: spacing.xs,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
});
