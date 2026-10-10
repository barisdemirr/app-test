import React, { useEffect, useRef, useState } from "react";
import { BackHandler, Vibration, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
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
  CallScreen,
  ProfileScreen,
  RewardsScreen,
} from "@/screens";
import { ScreenFade, Toast } from "@/components/ui";
import { JoinBanner } from "@/components/live";
import { useMascot } from "@/components/mascot";
import { useMemo } from "react";
import { flattenQa, useActiveSessions, useLiveList, useQaConfig, useQaQuestions, useUnreadCount } from "@/queries";
import { qaCategoriesFor } from "@/utils/qa";
import { usePushRegistration } from "@/push";
import type { LiveSessionDto } from "@/api/types";

const flatLiveOf = (q: { data?: { pages: { items: LiveSessionDto[] }[] } }) =>
  q.data?.pages.flatMap((pg) => pg.items) ?? [];
const flatLive = flatLiveOf;

const NAV_H = 67;
const NAV_WRAP = 83;

export function AppShell() {
  const insets = useSafeAreaInsets();
  const a = useApp();
  const { signOut, user } = useAuth();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Maskot Dolphy: giriş sonrası, ekran değişince (en çok 75 sn'de bir) ve kredi kazanınca ekrandan geçip kaçar
  const mascot = useMascot();
  const lastDash = useRef(0);
  const prevCredits = useRef<number | null>(null);
  const dashOnce = (at: number, gapMs: number) => {
    const now = Date.now();
    if (now - lastDash.current < gapMs) return;
    lastDash.current = now;
    mascot.dash({ at });
  };
  useEffect(() => {
    if (!a.ready) return;
    const t = setTimeout(() => dashOnce(0.28, 0), 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.ready]);
  useEffect(() => {
    if (a.screen === "home" || a.screen === "list" || a.screen === "rewards" || a.screen === "profile") {
      const t = setTimeout(() => dashOnce(0.12 + Math.random() * 0.5, 75000), 700);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.screen]);
  useEffect(() => {
    if (prevCredits.current !== null && a.credits > prevCredits.current) dashOnce(0.2, 8000);
    prevCredits.current = a.credits;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.credits]);

  // Android geri tuşu: uygulamadan çıkmak yerine bir önceki ekrana dön (sheet'leri Modal kapatır)
  const aRef = useRef(a);
  aRef.current = a;
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      const s = aRef.current;
      if (s.screen === "live") s.closeSession();
      else if (s.screen === "feed") s.setScreen(s.feedSource.kind === "saved" ? "profile" : "home");
      else if (s.screen !== "home") s.setScreen("home");
      else return false; // ana sayfada: sistem varsayılanı (uygulamadan çık)
      return true;
    });
    return () => sub.remove();
  }, []);

  // Aşağı çek: bakiye, canlı oturumlar, sorular ve bildirim rozeti sunucudan tazelenir
  const refreshHome = async () => {
    setRefreshing(true);
    try {
      await Promise.all(
        [["balance"], ["live"], ["qa"], ["notifications"], ["stats"]].map((k) =>
          qc.invalidateQueries({ queryKey: k }),
        ),
      );
    } finally {
      setRefreshing(false);
    }
  };

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
  // Ders adları ≠ soru kategorileri: önce /qa/config kategorilerine eşle (yoksa liste sessizce boş kalırdı)
  const qaCfg = useQaConfig();
  const qaAllCats = qaCfg.data?.categories ?? [];
  const homeCats =
    a.courseFilter === "Tümü"
      ? qaCategoriesFor(a.selectedCourses, qaAllCats)
      : qaCategoriesFor([a.courseFilter], qaAllCats, false);
  const listCats = qaCategoriesFor(a.selectedCourses, qaAllCats);
  const homeQ = useQaQuestions({
    categories: homeCats,
    search: dSearch,
    limit: 10,
    enabled: a.ready && a.screen === "home",
    refetchMs: 20_000,
  });
  const listQ = useQaQuestions({
    categories: listCats,
    search: dSearch,
    limit: 20,
    enabled: a.ready && a.screen === "list" && a.listType === "questions",
    refetchMs: 15_000,
  });

  // Canlı oturumlar: ders filtresini biz ekleriz (rapor: courseIds'i her liste isteğine ekle)
  const courseIdOf = (name: string) => a.courses.find((c) => c.name === name)?.id;
  const liveCourseIds =
    a.courseFilter === "Tümü"
      ? a.selectedCourseIds
      : [courseIdOf(a.courseFilter)].filter((x): x is string => !!x);
  const onHome = a.ready && a.screen === "home";
  const voiceQ = useLiveList({ kind: "Voice", scope: "open", courseIds: liveCourseIds, pageSize: 10, enabled: onHome, refetchMs: 12_000 });
  const lessonQ = useLiveList({ kind: "Lesson", scope: "open", courseIds: liveCourseIds, pageSize: 10, enabled: onHome, refetchMs: 12_000 });
  // Yapılacak oturumlar uygulama genelinde izlenir: Katıl uyarısı her ekranda çıksın (aşağıda JoinBanner)
  const activeQ = useActiveSessions(a.ready);

  // Yeni bir oturum katılmaya hazır olunca titreşim: kullanıcı telefona bakmıyor olabilir
  const joinableSeen = useRef<Set<string> | null>(null);
  const activeItems = flatLiveOf(activeQ);
  const joinableKey = activeItems
    .filter((x) => x.canJoin && x.myRole !== "none")
    .map((x) => x.id)
    .sort()
    .join(",");
  useEffect(() => {
    const ids = joinableKey ? joinableKey.split(",") : [];
    const seen = joinableSeen.current;
    if (seen && ids.some((id) => !seen.has(id))) Vibration.vibrate([0, 160, 90, 160]);
    joinableSeen.current = new Set(ids);
  }, [joinableKey]);

  const listKind = a.listType === "lessons" ? "Lesson" : a.listType === "voice" ? "Voice" : undefined;
  const listLiveQ = useLiveList({
    kind: listKind,
    scope: a.listType === "mine" ? "mine" : "open",
    courseIds: a.listType === "mine" ? undefined : a.selectedCourseIds,
    enabled: a.ready && a.screen === "list" && a.listType !== "questions",
    refetchMs: a.listType === "mine" ? 6_000 : 10_000,
  });

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
    return <BootScreen offline={a.loadError} onRetry={a.reload} onSignOut={signOut} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.foam }}>
      <StatusBar style={a.screen === "feed" || a.screen === "call" ? "light" : "dark"} />

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
        <ScreenFade key={a.screen}>
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
            liveError={voiceQ.isError || lessonQ.isError}
            questionsError={homeQ.isError}
            refreshing={refreshing}
            onRefresh={refreshHome}
            onOpenSession={a.openSession}
            onJoinSession={(x) => a.openCall(x.id)}
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
            onBack={() => a.setScreen(a.feedSource.kind === "saved" ? "profile" : "home")}
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
            onBack={a.closeSession}
            onJoin={(s) => a.openCall(s.id)}
            showToast={a.showToast}
          />
        )}

        {a.screen === "call" && a.callSessionId && (
          <CallScreen
            id={a.callSessionId}
            topInset={insets.top}
            bottomInset={insets.bottom}
            onClose={() => a.openSession(a.callSessionId!)}
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
            liveError={listLiveQ.isError}
            questionsError={listQ.isError}
            onRetry={() => (a.listType === "questions" ? listQ.refetch() : listLiveQ.refetch())}
            hasMoreLive={!!listLiveQ.hasNextPage}
            loadingMoreLive={listLiveQ.isFetchingNextPage}
            onLoadMoreLive={() => listLiveQ.fetchNextPage()}
            onOpenSession={a.openSession}
            onJoinSession={(x) => a.openCall(x.id)}
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
        </ScreenFade>
      </View>

      {a.screen !== "call" && (
        <JoinBanner
          items={flatLive(activeQ)}
          hideForId={a.screen === "live" ? a.liveSessionId : null}
          hotOnly={a.screen === "feed"}
          bottom={navTop + 6}
          onJoin={(s) => a.openCall(s.id)}
          onOpen={a.openSession}
        />
      )}

      {a.screen !== "call" && (
        <BottomNav
          screen={a.screen}
          navBottom={navBottom}
          navHeight={NAV_H}
          navWrap={NAV_WRAP}
          onNavigate={a.goTab}
        />
      )}

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
          selectedCourses={a.selectedCourses}
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