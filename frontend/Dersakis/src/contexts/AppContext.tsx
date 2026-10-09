import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Screen, SheetName } from "@/types";
import { toggleIn } from "@/utils";
import * as ImagePicker from "expo-image-picker";
import type { AuthUser } from "@/api/auth";
import type { Course } from "@/api/courses";
import { errorMessage } from "@/api/errors";
import { useAuth } from "@/auth";
import {
  useBalance,
  useCourses,
  usePreferences,
  useStats,
  useUpdatePreferences,
} from "@/queries";
import { useVideoUpload, type UploadPhase } from "@/hooks/useVideoUpload";
import {
  buildQuestions,
  checkVideo,
  validateForm,
  type PickedVideo,
} from "@/utils/videoForm";
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
  interests: string[];
  availableInterests: string[];
  toggleInterest: (c: string) => void;

  // ---- feed ----
  quizVideo: { id: string; courseName: string } | null;
  openQuiz: (v: { id: string; courseName: string }) => void;
  feedSource: FeedSource;
  openFeed: (source?: FeedSource) => void;

  // ---- questions (Bilene sor) ----
  questionId: string | null;
  openQuestion: (id: string) => void;
  /** Soru sorulan/video yüklenen ders seçili değilse seçime ekler */
  selectCourseByName: (name: string) => void;

  // ---- list/search ----
  searchText: string;
  setSearchText: (v: string) => void;
  courseFilter: string;
  setCourseFilter: (c: string) => void;
  listType: "lessons" | "voice" | "mine" | "questions";
  openList: (t: "lessons" | "voice" | "mine" | "questions") => void;

  // ---- canlı oturumlar ----
  liveSessionId: string | null;
  openSession: (id: string) => void;
  /** Oturum / görüşme ekranından, oraya gelinen ekrana dön */
  closeSession: () => void;
  callSessionId: string | null;
  openCall: (id: string) => void;

  // ---- create form ----
  video: PickedVideo | null;
  pickVideo: () => void;
  uploadPhase: UploadPhase;
  uploadProgress: number;
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
  publish: () => Promise<void>;

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

  const [quizVideo, setQuizVideo] = useState<{ id: string; courseName: string } | null>(null);
  const openQuiz = (v: { id: string; courseName: string }) => {
    setQuizVideo(v);
    setSheet("quiz");
  };

  // feed
  const [feedSource, setFeedSource] = useState<FeedSource>({ kind: "feed" });

  // questions
  const [questionId, setQuestionId] = useState<string | null>(null);

  // list/search
  const [searchText, setSearchText] = useState("");
  const [courseFilter, setCourseFilter] = useState("Tümü");
  const [listType, setListType] = useState<"lessons" | "voice" | "mine" | "questions">("lessons");
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);
  const [callSessionId, setCallSessionId] = useState<string | null>(null);
  const [liveBack, setLiveBack] = useState<Screen>("home");

  // create form
  const [video, setVideo] = useState<PickedVideo | null>(null);
  const upload = useVideoUpload();
  const [formTitle, setFormTitle] = useState("");
  const [formTopic, setFormTopic] = useState("");
  const [formCourse, setFormCourse] = useState("");
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
    // uzun hata mesajları okunabilsin
    toastTimer.current = setTimeout(() => setToast(""), Math.min(5000, 1800 + m.length * 35));
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

  const openQuestion = (id: string) => {
    setQuestionId(id);
    setSheet("question");
  };

  const openSession = (id: string) => {
    // geri tuşu, oturuma hangi ekrandan gelindiyse oraya dönsün (liste, ana sayfa...)
    if (screen !== "live" && screen !== "call") setLiveBack(screen === "feed" ? "home" : screen);
    setLiveSessionId(id);
    setSheet("");
    setScreen("live");
  };
  const closeSession = () => setScreen(liveBack);

  const openCall = (id: string) => {
    setCallSessionId(id);
    setSheet("");
    setScreen("call");
  };

  const openList = (t: "lessons" | "voice" | "mine" | "questions") => {
    setListType(t);
    setSearchText("");
    setScreen("list");
  };

  // create
  // Ders seçilmediyse (ya da eski ad artık yoksa) seçili derslerden ilkini kullan
  const formCourseName = courses.some((c) => c.name === formCourse)
    ? formCourse
    : (selectedCourses[0] ?? courses[0]?.name ?? "");

  const pickVideo = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: false,
      });
      if (r.canceled || !r.assets[0]) return;
      const a = r.assets[0];
      const v: PickedVideo = {
        uri: a.uri,
        name: a.fileName ?? "video.mp4",
        durationMs: a.duration ?? null,
        sizeBytes: a.fileSize ?? null,
      };
      const err = checkVideo({ ...v, mimeType: a.mimeType });
      if (err) {
        setVideo(null);
        return setFormError(err);
      }
      setFormError("");
      setVideo(v);
    } catch {
      setFormError("Video seçilemedi.");
    }
  };

  const publish = async () => {
    if (upload.busy) return;
    const input = { title: formTitle, topic: formTopic, q1, q2, showQ2, video };
    const err = validateForm(input);
    if (err) return setFormError(err);
    const course = courses.find((c) => c.name === formCourseName);
    if (!course || !video) return setFormError("Bir ders seç.");
    setFormError("");
    try {
      // Yükleme bitene kadar uygulama açık kalmalı; kesilirse aynı taslakla yeniden denenir
      await upload.run(
        {
          courseId: course.id,
          title: formTitle.trim(),
          topic: formTopic.trim(),
          questions: buildQuestions(input),
        },
        video.uri,
      );
    } catch (e) {
      return setFormError(errorMessage(e));
    }
    ensureCourseSelected(formCourseName);
    setFormTitle("");
    setFormTopic("");
    setQ1(emptyQ());
    setQ2(emptyQ());
    setShowQ2(false);
    setVideo(null);
    showToast("Videon yayınlandı");
    openFeed();
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
    interests,
    availableInterests,
    toggleInterest,

    quizVideo,
    openQuiz,
    feedSource,
    openFeed,

    questionId,
    openQuestion,
    selectCourseByName: ensureCourseSelected,

    searchText,
    setSearchText,
    courseFilter,
    setCourseFilter,
    listType,
    openList,
    liveSessionId,
    openSession,
    closeSession,
    callSessionId,
    openCall,

    video,
    pickVideo,
    uploadPhase: upload.phase,
    uploadProgress: upload.progress,
    formTitle,
    setFormTitle,
    formTopic,
    setFormTopic,
    formCourse: formCourseName,
    setFormCourse,
    q1,
    setQ1,
    q2,
    setQ2,
    showQ2,
    setShowQ2,
    formError,
    publish,

    toast,
    showToast,

    onboarded,
    completeOnboarding,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export { AppContext };