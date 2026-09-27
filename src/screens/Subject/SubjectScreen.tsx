import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { visualHeight } from '../../components/LearningObject/LearningObject';
import { LessonTile } from '../../components/LessonTile/LessonTile';
import { Screen } from '../../components/Screen/Screen';
import { getLessonsForSubject, getSubject } from '../../content';
import type { SubjectId } from '../../lesson/types';
import { cardSurface, radius, spacing, textStyles, ui } from '../../theme';

const idleAnimation = require('../../assets/images/Idle.gif');
const colorsTitleImage = require('../../assets/images/colors.png');

interface SubjectScreenProps {
  subjectId: SubjectId;
  onOpenLesson: (lessonId: string) => void;
  onBack: () => void;
}

/** Tiles per row. Two is a deliberate choice — see the note below. */
const COLUMNS = 2;

/**
 * The lesson picker for one subject.
 *
 * This screen exists because of a gap that a single lesson hid completely:
 * before it, opening a subject went straight into its first lesson and there
 * was no way to reach a second. Ten number lessons need somewhere to be chosen
 * from.
 *
 * WHY A GRID AND NOT A LIST. Two columns means all six colours, and most of the
 * ten numbers, are visible at once without scrolling — so choosing is a glance
 * rather than a scroll. This is a bounded grid of a handful of tiles, which is
 * a different thing from the infinite scrolling the app avoids: there is a
 * bottom, you can see it, and nothing loads when you reach it.
 */
export function SubjectScreen({
  subjectId,
  onOpenLesson,
  onBack,
}: SubjectScreenProps) {
  const subject = getSubject(subjectId);
  const lessons = getLessonsForSubject(subjectId);
  const { width } = useWindowDimensions();

  /*
   * How big the drawing inside each tile should be.
   *
   * The screen has `spacing.lg` padding either side and `spacing.md` between
   * the two columns, so each tile gets that leftover width halved. Then we take
   * about two thirds of it for the drawing, leaving the tile a comfortable
   * margin, and cap it so tiles do not become enormous on a tablet.
   */
  const tileWidth = (width - spacing.lg * 2 - spacing.md) / COLUMNS;
  const visualSize = Math.min(120, Math.round(tileWidth * 0.62));

  /*
   * How much vertical room to give every drawing.
   *
   * A colour is a circle and fills its square, but a group of dots is wider
   * than it is tall — ten dots five to a row are only two rows high. Reserving
   * a square for those would leave most of every tile empty and push half the
   * numbers below the fold, so we ask the drawings themselves how tall they
   * come out and take the largest. Every tile then gets that same height, which
   * is what keeps the rows aligned.
   */
  const visualBoxHeight = Math.max(
    0,
    ...lessons.map(lesson => visualHeight(lesson.concept.visual, visualSize)),
  );

  return (
    <Screen style={subjectId === 'colors' ? styles.colorsScreen : undefined}>
      {/* The same quiet, adult-sized back control as a lesson's "Done". A
          child pressing around the screen should land in a lesson, not back
          out to the home screen. */}
      <View
        style={[
          styles.header,
          subjectId !== 'animals' && styles.centeredHeader,
        ]}>
        {subjectId === 'colors' ? (
          <Image
            source={colorsTitleImage}
            style={styles.colorsTitleImage}
            resizeMode="contain"
            accessible={false}
          />
        ) : (
          <Text style={styles.title}>{subject?.title ?? ''}</Text>
        )}
        <Pressable
          onPress={onBack}
          style={[
            styles.backButton,
            subjectId !== 'animals' && styles.centeredBackButton,
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back to home">
          <Text style={styles.backLabel}>Home</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}>
        {lessons.map((lesson, index) => (
          <View key={lesson.id} style={{ width: tileWidth }}>
            <LessonTile
              lesson={lesson}
              visualSize={visualSize}
              visualBoxHeight={visualBoxHeight}
              // Tiles arrive in sequence, 60ms apart. Slightly quicker than the
              // home screen's cards because there are more of them, and ten
              // tiles at 90ms each would be almost a second of waiting.
              entranceDelayMs={index * 60}
              onPress={() => onOpenLesson(lesson.id)}
            />
          </View>
        ))}
        {(
          subjectId === 'colors' ||
          subjectId === 'numbers' ||
          subjectId === 'animals'
        ) && (
          <View style={styles.idleCard}>
            <Image
              source={idleAnimation}
              style={styles.idleImage}
              resizeMode="contain"
              accessible={false}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  colorsScreen: {
    paddingTop: 11,
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
  },
  centeredHeader: {
    justifyContent: 'center',
  },
  title: {
    ...textStyles.title,
    color: ui.ink,
  },
  colorsTitleImage: {
    width: 190,
    height: 84,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    ...cardSurface,
  },
  backLabel: {
    ...textStyles.caption,
    color: ui.inkSoft,
  },
  centeredBackButton: {
    position: 'absolute',
    top: spacing.md,
    right: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  idleCard: {
    width: '100%',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...cardSurface,
  },
  idleImage: {
    width: '100%',
    height: 300,
  },
});
