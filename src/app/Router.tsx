import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeInOnChange } from '../animation/transitions';
import { getLesson, getLessonsForSubject, getNextLesson } from '../content';
import type { SubjectId } from '../lesson/types';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { LessonScreen } from '../screens/Lesson/LessonScreen';
import { ParentScreen } from '../screens/Parent/ParentScreen';
import { ResultsScreen } from '../screens/Results/ResultsScreen';
import { SubjectScreen } from '../screens/Subject/SubjectScreen';
import { routeKey, type Route } from './routes';

/**
 * The app's navigation.
 *
 * This is deliberately not React Navigation. With four destinations, no
 * nesting and no deep links, a library would add two native dependencies and
 * solve problems we do not have — but the real reason is a product one: a
 * navigation stack gives a toddler swipe-back gestures and a history to pop,
 * which means backing out of a lesson mid-question by accident. Here, the only
 * way out of a lesson is the small "Done" control an adult goes looking for.
 *
 * Swapping in React Navigation later is a change to this one file: the screens
 * take plain props and callbacks, and know nothing about how they were
 * reached.
 *
 * One consequence worth understanding: switching routes unmounts the old
 * screen. That is what makes "Again" work — a fresh `LessonScreen` means a
 * fresh engine, starting at step one, with no state to reset by hand.
 */
export function Router() {
  const [route, setRoute] = useState<Route>({ name: 'home' });

  // Fades the whole screen in whenever the route changes. Slow and identical
  // every time, so a transition is never a surprise.
  const fadeStyle = useFadeInOnChange(routeKey(route));

  // `useCallback` keeps these functions stable between renders. That matters
  // here because LessonScreen watches `onFinished` in an effect.
  const goHome = useCallback(() => setRoute({ name: 'home' }), []);
  const goParent = useCallback(() => setRoute({ name: 'parent' }), []);

  const openSubject = useCallback((subjectId: SubjectId) => {
    // Subjects with no lessons yet are already non-tappable on the home
    // screen; this is just a second line of defence.
    if (getLessonsForSubject(subjectId).length > 0) {
      setRoute({ name: 'subject', subjectId });
    }
  }, []);

  const openLesson = useCallback((lessonId: string) => {
    setRoute({ name: 'lesson', lessonId });
  }, []);

  const showResults = useCallback((lessonId: string) => {
    setRoute({ name: 'results', lessonId });
  }, []);

  /**
   * Back out of a lesson, to the picker it was chosen from.
   *
   * Going home instead would mean two taps to get to the next lesson, and a
   * parent closing "three" almost always wants "four", not the front door.
   */
  const leaveLesson = useCallback((lessonId: string) => {
    const lesson = getLesson(lessonId);
    setRoute(
      lesson
        ? { name: 'subject', subjectId: lesson.concept.subject }
        : { name: 'home' },
    );
  }, []);

  function renderRoute() {
    switch (route.name) {
      case 'home':
        return (
          <HomeScreen onOpenSubject={openSubject} onOpenParent={goParent} />
        );

      case 'subject':
        return (
          <SubjectScreen
            subjectId={route.subjectId}
            onOpenLesson={openLesson}
            onBack={goHome}
          />
        );

      case 'lesson': {
        const lesson = getLesson(route.lessonId);
        if (!lesson) {
          // Should not happen, but falling back to home beats a blank screen.
          return (
            <HomeScreen onOpenSubject={openSubject} onOpenParent={goParent} />
          );
        }
        return (
          <LessonScreen
            lesson={lesson}
            onExit={() => leaveLesson(lesson.id)}
            onFinished={() => showResults(lesson.id)}
          />
        );
      }

      case 'results': {
        const lesson = getLesson(route.lessonId);
        if (!lesson) {
          return (
            <HomeScreen onOpenSubject={openSubject} onOpenParent={goParent} />
          );
        }
        // Undefined at the end of a subject, which hides the "Next" button
        // rather than showing one that does nothing.
        const next = getNextLesson(lesson.id);
        return (
          <ResultsScreen
            lesson={lesson}
            onRepeat={() => openLesson(lesson.id)}
            onNext={next ? () => openLesson(next.id) : undefined}
            onHome={goHome}
          />
        );
      }

      case 'parent':
        return <ParentScreen onBack={goHome} />;
    }
  }

  return (
    <Animated.View style={[styles.container, fadeStyle]}>
      {renderRoute()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
