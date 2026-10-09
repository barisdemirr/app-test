import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import type { Question, Quiz, Reel, Reward, Screen, SheetName, UserProfile } from "@/types";
import {
  DAILY_CAP,
  FACT,
  initialQuestions,
  initialReels,
  mockUser,
} from "@/mocks";
import { toggleIn } from "@/utils";
import type { QForm } from "@/screens/CreateScreen";

export type Stats = { total: number; correct: number };

export type AppContextValue = {
  // ---- navigation ----
  screen: Screen;
  sheet: SheetName;
  setScreen: (s: Screen) => void;
  setSheet: (s: SheetName) => void;
  goTab: (s: Screen) => void;

  // ---- user ----
  user: UserProfile;
  credits: number;
  earnedToday: number;
  dailyCap: number;
  streak: number;
  stats: Stats;
  accuracyPct: number;

  // ---- course prefs ----
  selectedCourses: string[];
  toggleCourse: (c: string) => void;
  joinedCourses: string[];
  joinCourse: (title: string) => void;
  interests: string[];
  toggleInterest: (c: string) => void;

  // ---- reels ----
  reels: Reel[];
  visibleReels: Reel[];
  activeIndex: number;
  safeIndex: number;
  activeReel?: Reel;
  progress: number;
  playing: boolean;
  finished: string[];
  learned: string[];
  saved: string[];
  setActiveIndex: (i: number) => void;
  setProgress: (p: number) => void;
  setPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  openFeed: (id?: string) => void;
  onFeedScrollEnd: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onTogglePlay: (idx: number) => void;
  onLearn: (id: string) => void;
  onSave: (id: string) => void;
  onReplay: (id: string) => void;
  onSeek: (p: number) => void;
  feedRef: React.RefObject<{ scrollTo: (opts: { y: number; animated: boolean }) => void } | null>;

  // ---- quiz ----
  quizStep: number;
  quizChoice: number | null;
  openQuiz: () => void;
  pickOption: (i: number, options: { text: string; ok: boolean }[]) => void;
  nextQuiz: () => void;

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
  setOnboarded: (v: boolean) => void;
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

  // user
  const [user] = useState<UserProfile>(mockUser);
  const [credits, setCredits] = useState(mockUser.credits);
  const [earnedToday, setEarnedToday] = useState(mockUser.earnedToday);
  const [stats, setStats] = useState<Stats>(mockUser.stats);
  const [bio, setBio] = useState(mockUser.bio);
  const dailyCap = mockUser.dailyCap;
  const streak = mockUser.streak;

  // course prefs
  const [selectedCourses, setSelectedCourses] = useState<string[]>([
    "Matematik 1",
    "Fizik 1",
  ]);
  const [joinedCourses, setJoinedCourses] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([
    "Matematik",
    "Fizik",
    "Uzay",
  ]);

  // reels
  const [reels, setReels] = useState<Reel[]>(initialReels);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [finished, setFinished] = useState<string[]>([]);
  const [learned, setLearned] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [awarded, setAwarded] = useState<string[]>([]);
  const feedRef = useRef<{ scrollTo: (opts: { y: number; animated: boolean }) => void } | null>(null);

  // quiz
  const [quizStep, setQuizStep] = useState(0);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);

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
  const [onboarded, setOnboarded] = useState(false);

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

  // visible reels
  const visibleReels = useMemo(
    () =>
      reels.filter(
        (r) => r.course === FACT || selectedCourses.includes(r.course),
      ),
    [reels, selectedCourses],
  );
  const safeIndex = Math.min(activeIndex, Math.max(0, visibleReels.length - 1));
  const activeReel: Reel | undefined = visibleReels[safeIndex];

  const toggleCourse = (c: string) => {
    setSelectedCourses((prev) => {
      if (prev.includes(c)) {
        if (prev.length === 1) {
          showToast("En az bir ders seçili olmalı");
          return prev;
        }
        return prev.filter((x) => x !== c);
      }
      return [...prev, c];
    });
  };

  const toggleInterest = (c: string) => setInterests((x) => toggleIn(x, c));
  const joinCourse = (title: string) =>
    setJoinedCourses((j) => (j.includes(title) ? j : [...j, title]));

  const awardCredit = useCallback(() => {
    if (earnedToday >= dailyCap) {
      showToast("Günlük kredi tavanına ulaştın");
      return;
    }
    setCredits((c) => c + 5);
    setEarnedToday((n) => Math.min(dailyCap, n + 5));
    showToast("+5 kredi");
  }, [earnedToday, dailyCap, showToast]);

  const openFeed = useCallback(
    (id?: string) => {
      let idx = 0;
      if (id) {
        const i = visibleReels.findIndex((r) => r.id === id);
        if (i >= 0) idx = i;
      }
      const target = visibleReels[idx];
      const done = target ? finished.includes(target.id) : false;
      setActiveIndex(idx);
      setProgress(done ? 1 : 0);
      setPlaying(!done);
      setSheet("");
      setScreen("feed");
    },
    [visibleReels, finished],
  );

  const goTab = (s: Screen) => {
    setSheet("");
    if (s === "feed") return openFeed();
    setScreen(s);
  };

  // feed scroll
  const onFeedScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const h = e.nativeEvent.layoutMeasurement.height || 1;
    const i = Math.round(e.nativeEvent.contentOffset.y / h);
    if (i !== safeIndex && visibleReels[i]) {
      const done = finished.includes(visibleReels[i].id);
      setActiveIndex(i);
      setProgress(done ? 1 : 0);
      setPlaying(!done);
    }
  };

  // reels timer
  const activeId = activeReel?.id;
  const activeFinished = activeId ? finished.includes(activeId) : false;

  useEffect(() => {
    if (screen !== "feed" || !playing || !activeId || activeFinished) return;
    const t = setInterval(
      () => setProgress((p) => Math.min(1, p + 0.0086)),
      120,
    );
    return () => clearInterval(t);
  }, [screen, playing, activeId, activeFinished]);

  useEffect(() => {
    if (screen === "feed" && activeId && progress >= 1 && !activeFinished) {
      setFinished((f) => [...f, activeId]);
      setPlaying(false);
    }
  }, [screen, progress, activeId, activeFinished]);

  const onTogglePlay = (idx: number) => {
    if (idx !== safeIndex) return;
    if (progress >= 1) return;
    setPlaying((v) => !v);
  };

  const onLearn = (id: string) => setLearned((l) => toggleIn(l, id));

  const onSave = (id: string) => {
    setSaved((s) => toggleIn(s, id));
    showToast(
      saved.includes(id)
        ? "Kaydedilenlerden çıkarıldı"
        : "Kaydettiklerime eklendi",
    );
  };

  const onReplay = (id: string) => {
    setFinished((f) => f.filter((x) => x !== id));
    setProgress(0);
    setPlaying(true);
  };

  const onSeek = (p: number) => {
    setProgress(p);
    setPlaying(false);
  };

  // quiz
  const quizList = activeReel?.quiz ?? [];

  const openQuiz = () => {
    if (!activeReel || activeReel.quiz.length === 0) return;
    setQuizStep(0);
    setQuizChoice(null);
    setSheet("quiz");
  };

  const pickOption = (i: number, options: { text: string; ok: boolean }[]) => {
    if (quizChoice !== null || !activeReel) return;
    setQuizChoice(i);
    const ok = options[i].ok;
    setStats((s) => ({
      total: s.total + 1,
      correct: s.correct + (ok ? 1 : 0),
    }));
    if (ok) {
      const key = `${activeReel.id}-${quizStep}`;
      if (!awarded.includes(key)) {
        setAwarded((a) => [...a, key]);
        awardCredit();
      } else showToast("Bu soruda kredi daha önce alındı");
    }
  };

  const nextQuiz = () => {
    if (quizChoice === null) return showToast("Önce bir seçenek işaretle");
    if (quizStep < quizList.length - 1) {
      setQuizStep(quizStep + 1);
      setQuizChoice(null);
    } else {
      setSheet("");
      setQuizStep(0);
      setQuizChoice(null);
      showToast("Quiz tamamlandı");
    }
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
    setSelectedCourses((s) => (s.includes(askCourse) ? s : [...s, askCourse]));
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
    const toQuiz = (q: QForm): Quiz => ({
      q: q.q.trim(),
      correct: q.correct.trim(),
      wrong: q.wrong.map((w) => w.trim()),
      exp: q.exp.trim() || "Üretici bu soru için açıklama eklemedi.",
    });
    const quiz = [toQuiz(q1), ...(showQ2 && qComplete(q2) ? [toQuiz(q2)] : [])];
    const id = `u${Date.now()}`;
    const reel: Reel = {
      id,
      course: formCourse,
      creator: "Ada Yılmaz",
      initials: "AY",
      color: "#7276F4",
      title: formTitle.trim(),
      lines: [
        formTitle.trim(),
        `Konu: ${formTopic.trim()}`,
        formCourse,
        "Yeni içerik ✦",
      ],
      result: "Yeni içerik ✦",
      quiz,
    };
    setReels((r) => [reel, ...r]);
    setSelectedCourses((s) => (s.includes(formCourse) ? s : [...s, formCourse]));
    setFormTitle("");
    setFormTopic("");
    setQ1(emptyQ());
    setQ2(emptyQ());
    setShowQ2(false);
    setVideoSelected(false);
    setFormError("");
    showToast("Videon yayınlandı");
    setScreen("feed");
    setActiveIndex(0);
    setProgress(0);
    setPlaying(true);
  };

  const redeemReward = (r: Reward) => {
    if (credits < r.price) return;
    setCredits((c) => c - r.price);
    showToast("Ödül alındı");
  };

  const accuracyPct = Math.round((stats.correct / stats.total) * 100);

  const value: AppContextValue = {
    screen,
    sheet,
    setScreen,
    setSheet,
    goTab,

    user,
    credits,
    earnedToday,
    dailyCap,
    streak,
    stats,
    accuracyPct,

    selectedCourses,
    toggleCourse,
    joinedCourses,
    joinCourse,
    interests,
    toggleInterest,

    reels,
    visibleReels,
    activeIndex,
    safeIndex,
    activeReel,
    progress,
    playing,
    finished,
    learned,
    saved,
    setActiveIndex,
    setProgress,
    setPlaying,
    openFeed,
    onFeedScrollEnd,
    onTogglePlay,
    onLearn,
    onSave,
    onReplay,
    onSeek,
    feedRef,

    quizStep,
    quizChoice,
    openQuiz,
    pickOption,
    nextQuiz,

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
    setOnboarded,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export { AppContext };