import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
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
const snailImage = require('../../assets/images/snail.png');

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
  const isElevenInchIpadPro = Math.min(width, height) === 834;
  const tabletCardWidth =
    (width - spacing.lg * 2 - spacing.lg * 2) / 3;
  const primarySubjects = subjects.filter(subject => subject.id !== 'planets');
  const planetSubject = subjects.find(subject => subject.id === 'planets');

  const homeContent = (
    <>
      <Image
        source={sunImage}
        style={[styles.sun, !isTablet && styles.phoneSun]}
        resizeMode="contain"
        accessible={false}
      />
      {!isTablet && (
        <Image
          source={snailImage}
          style={[styles.snail, styles.phoneSnail]}
          resizeMode="contain"
          pointerEvents="none"
          accessible={false}
        />
      )}

      <View style={[styles.header, !isTablet && styles.phoneHeader]}>
        <Text style={styles.appName}>Petits Pas</Text>
      </View>

      <View style={[styles.cards, !isTablet && styles.phoneCards]}>
        {primarySubjects.map((subject, index) => (
          <View
            key={subject.id}
            style={[
              styles.cardSlot,
              isTablet && { width: tabletCardWidth },
            ]}>
            {subject.id === 'colors' && !isTablet && (
              <>
                <View style={styles.phoneHouseCluster}>
                  <Image
                    source={house4Image}
                    style={styles.phoneHouse}
                    resizeMode="contain"
                    accessible={false}
                  />
                  <Image
                    source={beeImage}
                    style={styles.phoneBee}
                    resizeMode="contain"
                    accessible={false}
                  />
                  <Image
                    source={secondBeeImage}
                    style={styles.phoneSecondBee}
                    resizeMode="contain"
                    accessible={false}
                  />
                </View>
                <View style={[styles.greetingCard, styles.phoneGreetingCard]}>
                  <Image
                    source={helloAnimation}
                    style={[styles.greetingImage, styles.phoneGreetingImage]}
                    resizeMode="contain"
                    accessible={false}
                  />
                  <Text style={styles.greetingInstruction}>
                    Click a module below to begin
                  </Text>
                </View>
              </>
            )}
            {subject.id === 'numbers' && isTablet && (
              <>
                <Image
                  source={house4Image}
                  style={styles.house}
                  resizeMode="contain"
                  accessible={false}
                />
                <Image
                      source={beeImage}
                      style={[
                        styles.bee,
                        isElevenInchIpadPro && styles.elevenInchIpadBee,
                      ]}
                  resizeMode="contain"
                  accessible={false}
                />
                <Image
                      source={secondBeeImage}
                      style={[
                        styles.secondBee,
                        isElevenInchIpadPro && styles.elevenInchIpadSecondBee,
                      ]}
                  resizeMode="contain"
                  accessible={false}
                />
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
              compact={!isTablet}
              largeDescription={isTablet}
              onPress={() => onOpenSubject(subject.id)}
            />
          </View>
        ))}
        {isTablet && (
          <View style={styles.greetingCard}>
            <Image
              source={helloAnimation}
              style={styles.greetingImage}
              resizeMode="contain"
              accessible={false}
            />
            <Text
              style={[
                styles.greetingInstruction,
                isTablet && styles.tabletGreetingInstruction,
              ]}>
              Click a module to begin
            </Text>
          </View>
        )}
        {planetSubject && (
          <View
            style={[
              styles.cardSlot,
              isTablet && { width: tabletCardWidth },
            ]}>
            <SubjectCard
              title={planetSubject.title}
              description={planetSubject.description}
              accentColor={subjectAccent[planetSubject.id]}
              isAvailable={planetSubject.lessons.length > 0}
              entranceDelayMs={subjects.length * 90}
              compact={!isTablet}
              largeDescription={isTablet}
              onPress={() => onOpenSubject(planetSubject.id)}
            />
          </View>
        )}
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
    </>
  );

  return isTablet ? (
    <Screen>
      <Image
        source={snailImage}
        style={styles.snail}
        resizeMode="contain"
        pointerEvents="none"
        accessible={false}
      />
      {homeContent}
    </Screen>
  ) : (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.phoneScrollContent}
        showsVerticalScrollIndicator={false}>
        {homeContent}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.xxxl * 2,
    paddingBottom: spacing.xxl,
  },
  phoneHeader: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
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
  phoneSun: {
    top: spacing.md,
    right: spacing.sm,
    width: 96,
    height: 96,
  },
  snail: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.xxxl,
    width: 172,
    height: 172,
  },
  phoneSnail: {
    bottom: spacing.md,
    left: spacing.sm,
    width: 96,
    height: 96,
  },
  greetingCard: {
    position: 'relative',
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
  phoneGreetingCard: {
    padding: spacing.sm,
    marginBottom: spacing.xl,
  },
  phoneGreetingImage: {
    height: 190,
  },
  greetingInstruction: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1.8,
    color: ui.warmBrown,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  tabletGreetingInstruction: {
    fontSize: 15,
    letterSpacing: 2.5,
  },
  phoneHouseCluster: {
    alignSelf: 'center',
    width: 230,
    height: 205,
    marginBottom: spacing.sm,
  },
  phoneHouse: {
    width: 220,
    height: 205,
  },
  phoneBee: {
    position: 'absolute',
    top: 48,
    right: -8,
    width: 34,
    height: 31,
  },
  phoneSecondBee: {
    position: 'absolute',
    top: 84,
    right: -24,
    width: 29,
    height: 26,
  },
  cards: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  phoneCards: {
    flex: undefined,
    alignContent: 'flex-start',
    paddingTop: spacing.md,
  },
  phoneScrollContent: {
    position: 'relative',
    paddingBottom: spacing.xl,
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
  elevenInchIpadBee: {
    top: -179,
    width: 49,
    height: 45,
  },
  elevenInchIpadSecondBee: {
    top: -147,
    width: 43,
    height: 41,
    marginLeft: 274,
  },
  parentLink: {
    alignSelf: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    transform: [{ translateY: -11 }],
    marginTop: spacing.xl,
    ...cardSurface,
  },
  parentLinkLabel: {
    ...textStyles.caption,
    color: ui.inkSoft,
  },
});
