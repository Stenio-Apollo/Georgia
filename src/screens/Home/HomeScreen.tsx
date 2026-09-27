import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Screen } from '../../components/Screen/Screen';
import { SubjectCard } from '../../components/SubjectCard/SubjectCard';
import { subjects } from '../../content';
import type { SubjectId } from '../../lesson/types';
import {
  cardSurface,
  radius,
  spacing,
  subjectAccent,
  textStyles,
  ui,
} from '../../theme';

const helloAnimation = require('../../assets/images/Hello.gif');
const beeImage = require('../../assets/images/bee.png');
const secondBeeImage = require('../../assets/images/bee-second.png');
const house4Image = require('../../assets/images/house4.png');
const sunImage = require('../../assets/images/sun.png');

interface HomeScreenProps {
  onOpenSubject: (subjectId: SubjectId) => void;
  onOpenParent: () => void;
}

/**
 * The home screen: three doors and nothing else.
 *
 * Things deliberately absent, each of which a typical children's app would
 * have: a mascot, a daily streak, a "continue where you left off" banner,
 * settings gears, a coin balance, any kind of badge. The screen a child sees
 * first sets the tone for everything after it, and the tone here is quiet.
 *
 * The subject list comes from the content registry, so this screen needs no
 * changes when numbers and animals get their lessons.
 */
export function HomeScreen({ onOpenSubject, onOpenParent }: HomeScreenProps) {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const tabletCardWidth =
    (width - spacing.lg * 2 - spacing.lg * 2) / 3;

  return (
    <Screen>
      <Image
        source={sunImage}
        style={styles.sun}
        resizeMode="contain"
        accessible={false}
      />

      <View style={styles.header}>
        <Text style={styles.appName}>Petits Pas</Text>
      </View>

      <View style={styles.cards}>
        {subjects.map((subject, index) => (
          <View
            key={subject.id}
            style={[
              styles.cardSlot,
              isTablet && { width: tabletCardWidth },
            ]}>
            {subject.id === 'numbers' && (
              <>
                <Image
                  source={house4Image}
                  style={[styles.house, !isTablet && styles.houseInline]}
                  resizeMode="contain"
                  accessible={false}
                />
                {isTablet && (
                  <>
                    <Image
                      source={beeImage}
                      style={styles.bee}
                      resizeMode="contain"
                      accessible={false}
                    />
                    <Image
                      source={secondBeeImage}
                      style={styles.secondBee}
                      resizeMode="contain"
                      accessible={false}
                    />
                  </>
                )}
              </>
            )}
            <SubjectCard
              title={subject.title}
              description={subject.description}
              accentColor={subjectAccent[subject.id]}
              // A subject is open if any lesson has actually been written.
              isAvailable={subject.lessons.length > 0}
              // Cards arrive one after another, 90ms apart. Enough to feel
              // settled rather than snapped into place, not enough to wait for.
              entranceDelayMs={index * 90}
              onPress={() => onOpenSubject(subject.id)}
            />
          </View>
        ))}
        <View style={styles.greetingCard}>
          <Image
            source={helloAnimation}
            style={styles.greetingImage}
            resizeMode="contain"
            accessible={false}
          />
        </View>
      </View>

      {/*
        The way into parent mode. Small, low-contrast, and at the very bottom
        for the same reason the lesson's close button is: an adult looking for
        it will find it, and a child pressing around the screen mostly will
        not. Parent content should never be one stray tap away from a lesson.
      */}
      <Pressable
        onPress={onOpenParent}
        style={styles.parentLink}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="For parents">
        <Text style={styles.parentLinkLabel}>For parents</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.xxxl * 2,
    paddingBottom: spacing.xxl,
  },
  appName: {
    ...textStyles.caption,
    color: ui.inkSoft,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sun: {
    position: 'absolute',
    top: spacing.xxxl,
    right: spacing.lg,
    width: 144,
    height: 144,
  },
  greetingCard: {
    width: '100%',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...cardSurface,
  },
  greetingImage: {
    width: '100%',
    height: 320,
  },
  cards: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  cardSlot: {
    position: 'relative',
    width: '100%',
  },
  house: {
    position: 'absolute',
    zIndex: 1,
    top: -300,
    left: '47%',
    width: 339,
    height: 330,
    marginLeft: -160,
  },
  houseInline: {
    position: 'relative',
    top: 0,
    left: 0,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  bee: {
    position: 'absolute',
    zIndex: 1,
    top: -225,
    left: '50%',
    width: 60,
    height: 55,
    marginLeft: 215,
  },
  secondBee: {
    position: 'absolute',
    zIndex: 1,
    top: -190,
    left: '50%',
    width: 52,
    height: 47,
    marginLeft: 285,
  },
  parentLink: {
    alignSelf: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    transform: [{ translateY: -11 }],
    ...cardSurface,
  },
  parentLinkLabel: {
    ...textStyles.caption,
    color: ui.inkSoft,
  },
});
