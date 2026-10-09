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
  NotificationsSheet,
  CreateVoiceSheet,
  CreateLessonSheet,
} from "@/components/sheets";
import {
  CreateScreen,
  emptyQ,
  FeedScreen,
  HomeScreen,
  ListScreen,
  LiveSessionScreen,
  ProfileScreen,
  RewardsScreen,
} from "@/screens";
import { Toast } from "@/components/ui";
import { useMemo } from "react";
import { flattenQa, useLiveList, useQaQuestions, useUnreadCount } from "@/queries";
import { usePushRegistration } from "@/push";

const NAV_H = 67;
const NAV_WRAP = 83;

export function AppShell() {
  const insets = useSafeAreaInsets();
  const a = useApp();
  const { signOut, user } = useAuth();

  const navBottom = insets.bottom + 10;
  const navTop = navBottom + NAV_WRAP;
  const bodyPad = navTop + 24;

  // Cihaz kaydı + push dinleyicileri. Bildirime dokununca ilgili oturum (yoksa kutu) açılır.
  // Ekran açılınca güncel durum yine sunucudan çekilir (bildirim eski olabilir).
  usePushRegistration((d) =>
    d.sessionId ? a.openSession(d.sessionId) : a.setSheet("notifications"),
  );
  const unreadQ = useUnreadCount();

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

  // Canlı oturumlar: ders filtresini biz ekleriz (rapor: courseIds'i her liste isteğine ekle)
  const courseIdOf = (name: string) => a.courses.find((c) => c.name === name)?.id;
  const liveCourseIds =
    a.courseFilter === "Tümü"
      ? a.selectedCourseIds
      : [courseIdOf(a.courseFilter)].filter((x): x is string => !!x);
  const onHome = a.ready && a.screen === "home";
  const voiceQ = useLiveList({ kind: "Voice", scope: "open", courseIds: liveCourseIds, pageSize: 10, enabled: onHome });
  const lessonQ = useLiveList({ kind: "Lesson", scope: "open", courseIds: liveCourseIds, pageSize: 10, enabled: onHome });
  const activeQ = useLiveList({ scope: "active", pageSize: 10, enabled: onHome, refetchMs: 30_000 });
  const listKind = a.listType === "lessons" ? "Lesson" : a.listType === "voice" ? "Voice" : undefined;
  const listLiveQ = useLiveList({
    kind: listKind,
    scope: a.listType === "mine" ? "mine" : "open",
    courseIds: a.listType === "mine" ? undefined : a.selectedCourseIds,
    enabled: a.ready && a.screen === "list" && a.listType !== "questions",
  });
  const flatLive = (q: typeof voiceQ) => q.data?.pages.flatMap((pg) => pg.items) ?? [];
  const lk = a.searchText.trim().toLowerCase();
  const matches = (x: { title: string; courseName: string; host: { displayName: string } }) =>
    !lk || `${x.title} ${x.courseName} ${x.host.displayName}`.toLowerCase().includes(lk);

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
          unread={unreadQ.data ?? 0}
          onBell={() => a.setSheet("notifications")}
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
            searchText={a.searchText}
            courseFilter={a.courseFilter}
            activeSessions={flatLive(activeQ)}
            voiceSessions={flatLive(voiceQ).filter(matches)}
            lessonSessions={flatLive(lessonQ).filter(matches)}
            liveLoading={voiceQ.isLoading || lessonQ.isLoading}
            onOpenSession={a.openSession}
            onCreateVoice={() => a.setSheet("voiceCreate")}
            onCreateLesson={() => a.setSheet("lessonCreate")}
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

        {a.screen === "live" && a.liveSessionId && (
          <LiveSessionScreen
            id={a.liveSessionId}
            topInset={insets.top}
            bodyPad={bodyPad}
            credits={a.credits}
            onBack={() => a.setScreen("home")}
            // TODO(aşama 12): POST /live/{id}/join + Agora kanalına gir
            onJoin={() => a.showToast("Görüşme ekranı bir sonraki adımda bağlanacak")}
            showToast={a.showToast}
          />
        )}

        {a.screen === "list" && (
          <ListScreen
            topInset={insets.top}
            bodyPad={bodyPad}
            listType={a.listType}
            searchText={a.searchText}
            liveItems={flatLive(listLiveQ).filter(matches)}
            liveLoading={listLiveQ.isLoading}
            hasMoreLive={!!listLiveQ.hasNextPage}
            loadingMoreLive={listLiveQ.isFetchingNextPage}
            onLoadMoreLive={() => listLiveQ.fetchNextPage()}
            onOpenSession={a.openSession}
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

      {a.sheet === "notifications" && (
        <NotificationsSheet
          toast={a.toast}
          onClose={() => a.setSheet("")}
          onOpenNotification={(n) => {
            if (n.data?.sessionId) a.openSession(n.data.sessionId);
          }}
        />
      )}

      {a.sheet === "voiceCreate" && (
        <CreateVoiceSheet
          toast={a.toast}
          credits={a.credits}
          defaultCourseId={a.selectedCourseIds[0] ?? ""}
          onClose={() => a.setSheet("")}
          onCreated={a.openSession}
        />
      )}

      {a.sheet === "lessonCreate" && (
        <CreateLessonSheet
          toast={a.toast}
          defaultCourseId={a.selectedCourseIds[0] ?? ""}
          onClose={() => a.setSheet("")}
          onCreated={a.openSession}
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