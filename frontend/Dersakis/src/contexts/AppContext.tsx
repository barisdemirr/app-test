import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Question, Reward, Screen, SheetName } from "@/types";
import { initialQuestions } from "@/mocks";
import { toggleIn } from "@/utils";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthUser } from "@/api/auth";
import type { BalanceDto } from "@/api/credits";
import type { Course } from "@/api/courses";
import { errorMessage } from "@/api/errors";
import { useAuth } from "@/auth";
import {
  queryKeys,
  useBalance,
  useCourses,
  usePreferences,
  useStats,
  useUpdatePreferences,
} from "@/queries";
import type { QForm } from "@/screens/CreateScreen";
import type { FeedSource } from "@/screens/FeedScreen";

export type Stats = { total: number; correct: number };

export type AppContextValue = {
  // ---- açılış verisi (dersler, tercihler, bakiye) ----
  ready: boolean;
  loadError: boolean;
  reload: () => void;
  courses: Course[];

  // ---- navigation ----
  screen: Screen;
  sheet: SheetName;
  setScreen: (s: Screen) => void;
  setSheet: (s: SheetName) => void;
  goTab: (s: Screen) => void;

  // ---- user ----
  user: AuthUser;
  credits: number;
  earnedToday: number;
  dailyCap: number;
  stats: Stats;
  accuracyPct: number;

  // ---- course prefs ----
  selectedCourses: string[];
  selectedCourseIds: string[];
  toggleCourse: (c: string) => void;
  joinedCourses: string[];
  joinCourse: (title: string) => void;
  interests: string[];
  availableInterests: string[];
  toggleInterest: (c: string) => void;

  // ---- feed ----
  quizVideo: { id: string; courseName: string } | null;
  openQuiz: (v: { id: string; courseName: string }) => void;
  feedSource: FeedSource;
  openFeed: (source?: FeedSource) => void;

  // ---- questions ----
  questions: Question[];
  selectedQuestion: number;
  openQuestion: (q: Question) => void;
  sendQuestion: () => void;
  sendAnswer: () => void;
  askCourse: string;
  setAskCourse: (c: string) => void;
  askTopic: string;
  setAskTopic: (v: string) => void;
  askText: string;
  setAskText: (v: string) => void;
  answerText: string;
  setAnswerText: (v: string) => void;

  // ---- list/search ----
  searchText: string;
  setSearchText: (v: string) => void;
  courseFilter: string;
  setCourseFilter: (c: string) => void;
  listType: "lessons" | "questions";
  openList: (t: "lessons" | "questions") => void;

  // ---- create form ----
  videoSelected: boolean;
  setVideoSelected: (v: boolean) => void;
  formTitle: string;
  setFormTitle: (v: string) => void;
  formTopic: string;
  setFormTopic: (v: string) => void;
  formCourse: string;
  setFormCourse: (c: string) => void;
  q1: QForm;
  setQ1: (q: QForm) => void;
  q2: QForm;
  setQ2: (q: QForm) => void;
  showQ2: boolean;
  setShowQ2: (v: boolean) => void;
  formError: string;
  publish: () => void;

  // ---- bio ----
  bio: string;
  setBio: (v: string) => void;

  // ---- rewards ----
  redeemReward: (r: Reward) => void;

  // ---- toast ----
  toast: string;
  showToast: (m: string) => void;

  // ---- onboarding ----
  onboarded: boolean;
  completeOnboarding: (courseIds: string[]) => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  children,
  emptyQ,
}: {
  children: React.ReactNode;
  emptyQ: () => QForm;
}) {
  const [screen, setScreen] = useState<Screen>("home");
  const [sheet, setSheet] = useState<SheetName>("");

  // ---- sunucu verisi (react-query) ----
  const qc = useQueryClient();
  const { user } = useAuth();
  const coursesQ = useCourses();
  const prefsQ = usePreferences();
  const balanceQ = useBalance();
  const statsQ = useStats();
  const updatePrefs = useUpdatePreferences();

  const ready = !!coursesQ.data && !!prefsQ.data && !!balanceQ.data;
  const loadError =
    !ready && (coursesQ.isError || prefsQ.isError || balanceQ.isError);
  const reload = () => {
    coursesQ.refetch();
    prefsQ.refetch();
    balanceQ.refetch();
  };

  const courses = coursesQ.data ?? [];
  const selectedCourseIds = prefsQ.data?.courseIds ?? [];
  const interests = prefsQ.data?.interests ?? [];
  const availableInterests = prefsQ.data?.availableInterests ?? [];
  const selectedCourses = useMemo(
    () =>
      (coursesQ.data ?? [])
        .filter((c) => selectedCourseIds.includes(c.id))
        .map((c) => c.name),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [coursesQ.data, prefsQ.data],
  );

  const credits = balanceQ.data?.balance ?? 0;
  const earnedToday = balanceQ.data?.dailyEarned ?? 0;
  const dailyCap = balanceQ.data?.dailyCap ?? 0;
  const stats: Stats = {
    total: statsQ.data?.answered ?? 0,
    correct: statsQ.data?.correct ?? 0,
  };

  // TODO(aşama 8): ödül henüz yerel; API'ye bağlanınca bu yama kalkacak.
  const patchBalance = (delta: number, earned = 0) =>
    qc.setQueryData<BalanceDto>(queryKeys.balance, (b) =>
      b
        ? {
            ...b,
            balance: b.balance + delta,
            dailyEarned: Math.min(b.dailyCap, b.dailyEarned + earned),
            dailyRemaining: Math.max(0, b.dailyRemaining - earned),
          }
        : b,
    );

  // TODO(aşama 9): biyografi /me/profile'a bağlanacak
  const [bio, setBio] = useState("");

  const [joinedCourses, setJoinedCourses] = useState<string[]>([]);

  const [quizVideo, setQuizVideo] = useState<{ id: string; courseName: string } | null>(null);
  const openQuiz = (v: { id: string; courseName: string }) => {
    setQuizVideo(v);
    setSheet("quiz");
  };

  // feed
  const [feedSource, setFeedSource] = useState<FeedSource>({ kind: "feed" });

  // questions
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [askCourse, setAskCourse] = useState("Matematik 1");
  const [askTopic, setAskTopic] = useState("");
  const [askText, setAskText] = useState("");
  const [answerText, setAnswerText] = useState("");

  // list/search
  const [searchText, setSearchText] = useState("");
  const [courseFilter, setCourseFilter] = useState("Tümü");
  const [listType, setListType] = useState<"lessons" | "questions">("lessons");

  // create form
  const [videoSelected, setVideoSelected] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formTopic, setFormTopic] = useState("");
  const [formCourse, setFormCourse] = useState("Matematik 1");
  const [q1, setQ1] = useState<QForm>(emptyQ);
  const [q2, setQ2] = useState<QForm>(emptyQ);
  const [showQ2, setShowQ2] = useState(false);
  const [formError, setFormError] = useState("");

  // toast
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // onboarding

  const showToast = useCallback((m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1800);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const savePrefs = (courseIds: string[], nextInterests: string[]) =>
    updatePrefs.mutate(
      { courseIds, interests: nextInterests },
      { onError: (e) => showToast(errorMessage(e)) },
    );

  const toggleCourse = (name: string) => {
    const c = courses.find((x) => x.name === name);
    if (!c) return;
    const has = selectedCourseIds.includes(c.id);
    if (has && selectedCourseIds.length === 1) {
      showToast("En az bir ders seçili olmalı");
      return;
    }
    savePrefs(
      has ? selectedCourseIds.filter((i) => i !== c.id) : [...selectedCourseIds, c.id],
      interests,
    );
  };

  // Soru sorulan / video yüklenen ders seçili değilse seçime ekle (mevcut davranış korunur)
  const ensureCourseSelected = (name: string) => {
    const c = courses.find((x) => x.name === name);
    if (c && !selectedCourseIds.includes(c.id)) {
      savePrefs([...selectedCourseIds, c.id], interests);
    }
  };

  const toggleInterest = (name: string) =>
    savePrefs(selectedCourseIds, toggleIn(interests, name));

  const completeOnboarding = async (courseIds: string[]) => {
    await updatePrefs.mutateAsync({ courseIds, interests });
  };

  const onboarded = ready && selectedCourseIds.length > 0;

  const joinCourse = (title: string) =>
    setJoinedCourses((j) => (j.includes(title) ? j : [...j, title]));

  const openFeed = useCallback((source: FeedSource = { kind: "feed" }) => {
    setFeedSource(source);
    setSheet("");
    setScreen("feed");
  }, []);

  const goTab = (s: Screen) => {
    setSheet("");
    if (s === "feed") return openFeed();
    setScreen(s);
  };

  // questions
  const sendQuestion = () => {
    if (!askText.trim()) return showToast("Sorunu yazmayı unutma");
    setQuestions((qs) => [
      {
        name: "Ada",
        initials: "AY",
        color: "#8B8CF8",
        course: askCourse,
        topic: askTopic.trim() || "Genel",
        text: askText.trim(),
        answers: [],
      },
      ...qs,
    ]);
    ensureCourseSelected(askCourse);
    setAskText("");
    setAskTopic("");
    setSheet("");
    showToast("Sorun paylaşıldı");
  };

  const sendAnswer = () => {
    if (!answerText.trim()) return showToast("Yanıtını yazmayı unutma");
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === selectedQuestion
          ? { ...q, answers: [...q.answers, answerText.trim()] }
          : q,
      ),
    );
    setAnswerText("");
    showToast("Yanıtın eklendi");
  };

  const openQuestion = (q: Question) => {
    setSelectedQuestion(questions.indexOf(q));
    setAnswerText("");
    setSheet("question");
  };

  const openList = (t: "lessons" | "questions") => {
    setListType(t);
    setSearchText("");
    setScreen("list");
  };

  // create
  const qComplete = (q: QForm) =>
    q.q.trim() && q.correct.trim() && q.wrong.every((w) => w.trim());
  const qEmpty = (q: QForm) =>
    !q.q.trim() && !q.correct.trim() && q.wrong.every((w) => !w.trim());

  const publish = () => {
    if (!formTitle.trim() || !formTopic.trim())
      return setFormError("Başlık ve konu gerekli.");
    if (!videoSelected)
      return setFormError("20 sn ile 2 dk arasında bir video seç.");
    if (!qComplete(q1))
      return setFormError("İlk soru için soru metnini ve 4 şıkkı doldur.");
    if (showQ2 && !qEmpty(q2) && !qComplete(q2))
      return setFormError("Soru 2 için soru metnini ve 4 şıkkı doldur.");
    // TODO(aşama 6): POST /videos + PUT /videos/{id}/content
    showToast("Video yükleme bir sonraki aşamada bağlanacak");
  };

  const redeemReward = (r: Reward) => {
    if (credits < r.price) return;
    patchBalance(-r.price);
    showToast("Ödül alındı");
  };

  const accuracyPct = statsQ.data?.percent ?? 0;

  const value: AppContextValue = {
    ready,
    loadError,
    reload,
    courses,

    screen,
    sheet,
    setScreen,
    setSheet,
    goTab,

    user: user as AuthUser, // AppProvider yalnızca oturum açıkken (Root) bağlanır
    credits,
    earnedToday,
    dailyCap,
    stats,
    accuracyPct,

    selectedCourses,
    selectedCourseIds,
    toggleCourse,
    joinedCourses,
    joinCourse,
    interests,
    availableInterests,
    toggleInterest,

    quizVideo,
    openQuiz,
    feedSource,
    openFeed,

    questions,
    selectedQuestion,
    openQuestion,
    sendQuestion,
    sendAnswer,
    askCourse,
    setAskCourse,
    askTopic,
    setAskTopic,
    askText,
    setAskText,
    answerText,
    setAnswerText,

    searchText,
    setSearchText,
    courseFilter,
    setCourseFilter,
    listType,
    openList,

    videoSelected,
    setVideoSelected,
    formTitle,
    setFormTitle,
    formTopic,
    setFormTopic,
    formCourse,
    setFormCourse,
    q1,
    setQ1,
    q2,
    setQ2,
    showQ2,
    setShowQ2,
    formError,
    publish,

    bio,
    setBio,

    redeemReward,

    toast,
    showToast,

    onboarded,
    completeOnboarding,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export { AppContext };