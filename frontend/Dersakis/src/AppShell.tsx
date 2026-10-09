import React from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "@/theme";
import { useApp } from "@/hooks";
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

  const filteredQuestions = useMemo(() => {
    return a.questions.filter(
      (x) =>
        a.selectedCourses.includes(x.course) &&
        (a.courseFilter === "Tümü" || x.course === a.courseFilter) &&
        `${x.text} ${x.name} ${x.course} ${x.topic}`
          .toLowerCase()
          .includes(a.searchText.toLowerCase()),
    );
  }, [a.questions, a.selectedCourses, a.courseFilter, a.searchText]);

  const lk = a.searchText.toLowerCase();
  const listLessons = lessons.filter(
    (x) =>
      a.selectedCourses.includes(x.course) &&
      `${x.title} ${x.course} ${x.teacher}`.toLowerCase().includes(lk),
  );
  const listQuestions = a.questions.filter(
    (x) =>
      a.selectedCourses.includes(x.course) &&
      `${x.text} ${x.course} ${x.topic} ${x.name}`.toLowerCase().includes(lk),
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
            filteredQuestions={filteredQuestions}
            bodyPad={bodyPad}
            onSearchChange={a.setSearchText}
            onCourseFilterChange={a.setCourseFilter}
            onOpenFilter={() => a.setSheet("filter")}
            onOpenList={a.openList}
            onOpenFeed={() => a.goTab("feed")}
            onOpenQuestion={a.openQuestion}
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
            onRedeem={a.redeemReward}
          />
        )}

        {a.screen === "profile" && (
          <ProfileScreen
            bodyPad={bodyPad}
            bio={a.bio}
            credits={a.credits}
            earnedToday={a.earnedToday}
            stats={a.stats}
            selectedCourses={a.selectedCourses}
            interests={a.interests}
            availableInterests={a.availableInterests}
            onBioChange={a.setBio}
            onSaveBio={() => a.showToast("Profilin kaydedildi")}
            onToggleCourse={a.toggleCourse}
            onToggleInterest={a.toggleInterest}
            onWatchSaved={(id) => a.openFeed({ kind: "saved", startId: id })}
            showToast={a.showToast}
            onPhoto={() => a.showToast("Fotoğraf seçimi yakında")}
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
            listQuestions={listQuestions}
            onBack={() => a.setScreen("home")}
            onSearchChange={a.setSearchText}
            onOpenQuestion={a.openQuestion}
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
          askCourse={a.askCourse}
          askTopic={a.askTopic}
          askText={a.askText}
          onClose={() => a.setSheet("")}
          onCourseChange={a.setAskCourse}
          onTopicChange={a.setAskTopic}
          onTextChange={a.setAskText}
          onSubmit={a.sendQuestion}
        />
      )}

      {a.sheet === "question" && a.questions[a.selectedQuestion] && (
        <QuestionSheet
          question={a.questions[a.selectedQuestion]}
          toast={a.toast}
          answerText={a.answerText}
          onClose={() => a.setSheet("")}
          onAnswerChange={a.setAnswerText}
          onSubmit={a.sendAnswer}
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