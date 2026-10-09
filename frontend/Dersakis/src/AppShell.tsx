import React from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "@/theme";
import { useApp, useDebounced } from "@/hooks";
import { useAuth } from "@/auth";
import { BootScreen } from "@/screens/auth";
import { Header } from "@/components/navigation";
import { BottomNav } from "@/components/navigation";
import {
  AskSheet,
  FilterSheet,
  OnboardingSheet,
  QuestionSheet,
  QuizSheet,
} from "@/components/sheets";
import {
  CreateScreen,
  emptyQ,
  FeedScreen,
  HomeScreen,
  ListScreen,
  ProfileScreen,
  RewardsScreen,
} from "@/screens";
import { lessons } from "@/mocks";
import { Toast } from "@/components/ui";
import { useMemo } from "react";
import { flattenQa, useQaQuestions } from "@/queries";

const NAV_H = 67;
const NAV_WRAP = 83;

export function AppShell() {
  const insets = useSafeAreaInsets();
  const a = useApp();
  const { signOut, user } = useAuth();

  const navBottom = insets.bottom + 10;
  const navTop = navBottom + NAV_WRAP;
  const bodyPad = navTop + 24;

  // derived lists
  const filteredLessons = useMemo(() => {
    return lessons.filter(
      (x) =>
        a.selectedCourses.includes(x.course) &&
        (a.courseFilter === "Tümü" || x.course === a.courseFilter) &&
        `${x.title} ${x.teacher} ${x.course}`
          .toLowerCase()
          .includes(a.searchText.toLowerCase()),
    );
  }, [a.selectedCourses, a.courseFilter, a.searchText]);

  // Bilene sor: kategori filtresi ve arama sunucuda yapılır (arama debounce'lu)
  const dSearch = useDebounced(a.searchText.trim(), 350);
  const homeCats = a.courseFilter === "Tümü" ? a.selectedCourses : [a.courseFilter];
  const homeQ = useQaQuestions({
    categories: homeCats,
    search: dSearch,
    limit: 10,
    enabled: a.ready && a.screen === "home",
  });
  const listQ = useQaQuestions({
    categories: a.selectedCourses,
    search: dSearch,
    limit: 20,
    enabled: a.ready && a.screen === "list" && a.listType === "questions",
  });

  const lk = a.searchText.toLowerCase();
  const listLessons = lessons.filter(
    (x) =>
      a.selectedCourses.includes(x.course) &&
      `${x.title} ${x.course} ${x.teacher}`.toLowerCase().includes(lk),
  );

  const showHeader =
    a.screen === "home" ||
    a.screen === "new" ||
    a.screen === "rewards" ||
    a.screen === "profile";

  // dersler, tercihler ve bakiye gelmeden ekranları çizme
  if (!a.ready) {
    return <BootScreen offline={a.loadError} onRetry={a.reload} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.foam }}>
      <StatusBar style={a.screen === "feed" ? "light" : "dark"} />

      {showHeader && (
        <Header
          topInset={insets.top}
          credits={a.credits}
          earnedToday={a.earnedToday}
          dailyCap={a.dailyCap}
        />
      )}

      <View style={{ flex: 1 }}>
        {a.screen === "home" && (
          <HomeScreen
            credits={a.credits}
            earnedToday={a.earnedToday}
            dailyCap={a.dailyCap}
            userName={user?.displayName ?? ""}
            accuracyPct={a.accuracyPct}
            selectedCourses={a.selectedCourses}
            joinedCourses={a.joinedCourses}
            searchText={a.searchText}
            courseFilter={a.courseFilter}
            filteredLessons={filteredLessons}
            filteredQuestions={flattenQa(homeQ.data)}
            questionsLoading={homeQ.isLoading}
            bodyPad={bodyPad}
            onSearchChange={a.setSearchText}
            onCourseFilterChange={a.setCourseFilter}
            onOpenFilter={() => a.setSheet("filter")}
            onOpenList={a.openList}
            onOpenFeed={() => a.goTab("feed")}
            onOpenQuestion={(q) => a.openQuestion(q.id)}
            onOpenAsk={() => a.setSheet("ask")}
            onJoinCourse={a.joinCourse}
          />
        )}

        {a.screen === "feed" && (
          <FeedScreen
            source={a.feedSource}
            courseIds={a.selectedCourseIds}
            interests={a.interests}
            topInset={insets.top}
            bottomOffset={navTop}
            suspended={a.sheet !== ""}
            onBack={() => a.setScreen("home")}
            onQuiz={(item) => a.openQuiz({ id: item.id, courseName: item.courseName })}
            showToast={a.showToast}
          />
        )}

        {a.screen === "new" && (
          <CreateScreen
            bodyPad={bodyPad}
            video={a.video}
            uploadPhase={a.uploadPhase}
            uploadProgress={a.uploadProgress}
            formTitle={a.formTitle}
            formTopic={a.formTopic}
            formCourse={a.formCourse}
            q1={a.q1}
            q2={a.q2}
            showQ2={a.showQ2}
            formError={a.formError}
            onSelectVideo={a.pickVideo}
            onFormTitle={a.setFormTitle}
            onFormTopic={a.setFormTopic}
            onFormCourse={a.setFormCourse}
            onQ1={a.setQ1}
            onQ2={a.setQ2}
            onShowQ2={() => a.setShowQ2(true)}
            onPublish={a.publish}
          />
        )}

        {a.screen === "rewards" && (
          <RewardsScreen
            credits={a.credits}
            bodyPad={bodyPad}
            toast={a.toast}
            showToast={a.showToast}
          />
        )}

        {a.screen === "profile" && (
          <ProfileScreen
            bodyPad={bodyPad}
            earnedToday={a.earnedToday}
            stats={a.stats}
            selectedCourses={a.selectedCourses}
            interests={a.interests}
            availableInterests={a.availableInterests}
            onToggleCourse={a.toggleCourse}
            onToggleInterest={a.toggleInterest}
            onWatchSaved={(id) => a.openFeed({ kind: "saved", startId: id })}
            showToast={a.showToast}
            onLogout={signOut}
          />
        )}

        {a.screen === "list" && (
          <ListScreen
            topInset={insets.top}
            bodyPad={bodyPad}
            listType={a.listType}
            searchText={a.searchText}
            listLessons={listLessons}
            listQuestions={flattenQa(listQ.data)}
            questionsLoading={listQ.isLoading}
            hasMoreQuestions={!!listQ.hasNextPage}
            loadingMoreQuestions={listQ.isFetchingNextPage}
            onLoadMoreQuestions={() => listQ.fetchNextPage()}
            onBack={() => a.setScreen("home")}
            onSearchChange={a.setSearchText}
            onOpenQuestion={(q) => a.openQuestion(q.id)}
          />
        )}
      </View>

      <BottomNav
        screen={a.screen}
        navBottom={navBottom}
        navHeight={NAV_H}
        navWrap={NAV_WRAP}
        onNavigate={a.goTab}
      />

      {a.sheet === "" && <Toast text={a.toast} bottom={navTop + 6} />}

      {a.sheet === "quiz" && a.quizVideo && (
        <QuizSheet
          videoId={a.quizVideo.id}
          courseName={a.quizVideo.courseName}
          toast={a.toast}
          onClose={() => a.setSheet("")}
          showToast={a.showToast}
        />
      )}

      {a.sheet === "ask" && (
        <AskSheet
          toast={a.toast}
          credits={a.credits}
          defaultCategory={a.selectedCourses[0] ?? ""}
          onClose={() => a.setSheet("")}
          onAsked={a.selectCourseByName}
          showToast={a.showToast}
        />
      )}

      {a.sheet === "question" && a.questionId && (
        <QuestionSheet
          questionId={a.questionId}
          toast={a.toast}
          onClose={() => a.setSheet("")}
          showToast={a.showToast}
        />
      )}

      {a.sheet === "filter" && (
        <FilterSheet
          toast={a.toast}
          courseFilter={a.courseFilter}
          onClose={() => a.setSheet("")}
          onCourseChange={a.setCourseFilter}
        />
      )}

      {!a.onboarded && (
        <OnboardingSheet
          toast={a.toast}
          onContinue={a.completeOnboarding}
        />
      )}
    </View>
  );
}