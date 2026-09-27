import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen/Screen';
import { SoftButton } from '../../components/SoftButton/SoftButton';
import { radius, spacing, textStyles, ui } from '../../theme';

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
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>For parents</Text>

        <Text style={styles.intro}>
          This app is built to be used alongside your child, not instead of you.
          It teaches one idea at a time, waits as long as your child needs, and
          never rewards speed. The words it speaks appear on screen so you can
          repeat them, or carry the idea off the screen and into the room.
        </Text>

        <View style={styles.sections}>
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
  content: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  heading: {
    ...textStyles.title,
    color: ui.ink,
  },
  intro: {
    ...textStyles.caption,
    color: ui.inkSoft,
  },
  sections: {
    gap: spacing.md,
  },
  section: {
    padding: spacing.lg,
    backgroundColor: ui.surface,
    borderRadius: radius.md,
    gap: spacing.xs,
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
