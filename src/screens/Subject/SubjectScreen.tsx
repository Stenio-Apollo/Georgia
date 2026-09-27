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
const animalsTitleImage = require('../../assets/images/animals.png');

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
  const isTablet = width >= 600;
  const usesFrostedScrollHeader =
    subjectId === 'animals' ||
    subjectId === 'colors' ||
    subjectId === 'numbers' ||
    subjectId === 'planets';
  const usesPlanetsLayout =
    subjectId === 'colors' || subjectId === 'numbers' || subjectId === 'planets';
  // Every module shares the Planet picker rhythm on phones. Tablet-specific
  // placement remains unchanged.
  const usesPlanetsMobileSpacing = !isTablet && usesFrostedScrollHeader;

  /*
   * How big the drawing inside each tile should be.
   *
   * The screen has `spacing.lg` padding either side and `spacing.md` between
   * the two columns, so each tile gets that leftover width halved. Then we take
   * about two thirds of it for the drawing, leaving the tile a comfortable
   * margin, and cap it so tiles do not become enormous on a tablet.
   */
  const tileWidth = (width - spacing.lg * 2 - spacing.md) / COLUMNS;
  const visualSize =
    subjectId === 'animals' || subjectId === 'planets'
      ? Math.min(220, Math.round(tileWidth))
      : Math.min(120, Math.round(tileWidth * 0.62));

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
  ) + (subjectId === 'animals' || subjectId === 'planets' ? spacing.xs * 2 : 0);

  return (
    <Screen>
      {/* The same quiet, adult-sized back control as a lesson's "Done". A
          child pressing around the screen should land in a lesson, not back
          out to the home screen. */}
      <View
        style={[
          styles.header,
          styles.centeredHeader,
          usesFrostedScrollHeader && styles.frostedScrollHeader,
          usesPlanetsMobileSpacing && styles.planetsFrostedScrollHeader,
        ]}>
        {subjectId === 'colors' ? (
          <Image
            source={colorsTitleImage}
            style={styles.colorsTitleImage}
            resizeMode="contain"
            accessible={false}
          />
        ) : subjectId === 'animals' ? (
          <Image
            source={animalsTitleImage}
            style={styles.animalsTitleImage}
            resizeMode="contain"
            accessible={false}
          />
        ) : subjectId === 'planets' || subjectId === 'numbers' ? (
          <View style={styles.planetHeading}>
            <View style={styles.planetHeadingRule} />
            <Text style={styles.planetHeadingLabel}>
              {subjectId === 'planets' ? '02 — PLANETS' : '01 — NUMBERS'}
            </Text>
          </View>
        ) : (
          <Text style={styles.title}>{subject?.title ?? ''}</Text>
        )}
        {(!usesFrostedScrollHeader || isTablet) && (
          <Pressable
            onPress={onBack}
            style={[
              styles.backButton,
              styles.centeredBackButton,
              usesFrostedScrollHeader && styles.tabletFrostedBackButton,
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back to home">
            <Text style={styles.backLabel}>Home</Text>
          </Pressable>
        )}
      </View>

      {usesFrostedScrollHeader && !isTablet && (
        <Pressable
          onPress={onBack}
          style={[
            styles.backButton,
            styles.frostedBackButton,
            usesPlanetsMobileSpacing && styles.planetsFrostedBackButton,
            subjectId === 'colors' && styles.colorsFrostedBackButton,
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back to home">
          <Text style={styles.backLabel}>Home</Text>
        </Pressable>
      )}

      <ScrollView
        style={usesFrostedScrollHeader ? styles.scrollWithFrostedHeader : undefined}
        contentContainerStyle={[
          styles.grid,
          usesFrostedScrollHeader && styles.gridWithFrostedHeader,
          usesPlanetsMobileSpacing && styles.planetsGridWithFrostedHeader,
          !isTablet &&
            subjectId === 'colors' &&
            styles.colorsGridWithFrostedHeader,
        ]}
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
        {(subjectId === 'colors' || subjectId === 'numbers') && (
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
  frostedScrollHeader: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 2,
    minHeight: 70 + spacing.md + spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    ...cardSurface,
  },
  planetsFrostedScrollHeader: {
    top: spacing.xl + 21,
  },
  title: {
    ...textStyles.title,
    color: ui.ink,
  },
  colorsTitleImage: {
    width: 190,
    height: 84,
  },
  animalsTitleImage: {
    width: 250,
    height: 70,
  },
  planetHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  planetHeadingRule: {
    width: 80,
    height: 1,
    backgroundColor: ui.warmBrown,
  },
  planetHeadingLabel: {
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 5,
    color: ui.warmBrown,
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
  tabletFrostedBackButton: {
    top: spacing.md + 11,
    right: 44,
  },
  frostedBackButton: {
    position: 'absolute',
    top: spacing.xl + 70 + spacing.md + spacing.lg + spacing.sm,
    alignSelf: 'center',
    zIndex: 2,
  },
  planetsFrostedBackButton: {
    top: spacing.xl + 70 + spacing.md + spacing.lg + spacing.sm + 21,
  },
  colorsFrostedBackButton: {
    top: spacing.xl + 70 + spacing.md + spacing.lg + spacing.sm + 35,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  scrollWithFrostedHeader: {
    flex: 1,
  },
  gridWithFrostedHeader: {
    paddingTop: 150,
  },
  planetsGridWithFrostedHeader: {
    paddingTop: 170,
  },
  colorsGridWithFrostedHeader: {
    paddingTop: 184,
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
