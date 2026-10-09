import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useQueryClient } from "@tanstack/react-query";
import { absoluteUrl } from "@/config";
import type { FeedItem } from "@/api/feed";
import { errorMessage } from "@/api/errors";
import { useWatchSession } from "@/hooks/useWatchSession";
import { patchFeedItem } from "@/queries";
import { colorFor, initialsOf } from "@/utils/user";
import { ReelChrome } from "./ReelChrome";
import type { ReelHandlers } from "./ReelCard";

type Props = ReelHandlers & {
  item: FeedItem;
  width: number;
  height: number;
  topInset: number;
  bottomOffset: number;
  /** Uygulama ön planda ve üstte sheet yok */
  running: boolean;
};

/** Yalnızca ekrandaki kart oynatıcı tutar; kaydırınca bir sonrakine devredilir. */
export function ActiveReel({ item, running, ...p }: Props) {
  const qc = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const userPaused = useRef(false);
  const durMs = useRef(item.durationMs);

  const player = useVideoPlayer(absoluteUrl(item.streamUrl), (pl) => {
    pl.loop = false;
    pl.playbackRate = 1;
    pl.timeUpdateEventInterval = 0.25;
  });

  const positionMs = useCallback(() => {
    try {
      return Math.round(player.currentTime * 1000);
    } catch {
      return 0;
    }
  }, [player]);

  const watch = useWatchSession({
    videoId: item.id,
    alreadyCompleted: item.watchCompleted,
    enabled: running,
    playing,
    getPositionMs: positionMs,
    onCompleted: () => patchFeedItem(qc, item.id, { watchCompleted: true }),
    onIncomplete: () => {
      // sunucu "yeterince izlenmedi" dedi: baştan izlet
      p.showToast("Videoyu atlamadan izlemelisin, baştan başlıyor");
      setEnded(false);
      setProgress(0);
      player.currentTime = 0;
      player.play();
    },
  });

  // oynatıcı olayları
  useEffect(() => {
    const subs = [
      player.addListener("timeUpdate", ({ currentTime }) => {
        const d = player.duration > 0 ? player.duration * 1000 : durMs.current;
        durMs.current = d;
        setProgress(d > 0 ? Math.min(1, (currentTime * 1000) / d) : 0);
      }),
      player.addListener("playingChange", ({ isPlaying }) => setPlaying(isPlaying)),
      player.addListener("playToEnd", () => {
        setEnded(true);
        setProgress(1);
        watch.complete().catch((e) => p.showToast(errorMessage(e)));
      }),
    ];
    return () => subs.forEach((s) => s.remove());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, watch.complete]);

  // ön plana göre otomatik oynat / duraklat
  useEffect(() => {
    if (running && !userPaused.current && !ended) player.play();
    else player.pause();
  }, [running, ended, player]);

  const toggle = () => {
    if (ended) return replay();
    if (playing) {
      userPaused.current = true;
      player.pause();
    } else {
      userPaused.current = false;
      player.play();
    }
  };

  const replay = () => {
    setEnded(false);
    setProgress(0);
    userPaused.current = false;
    player.replay();
  };

  const seek = (ratio: number) => {
    const d = durMs.current;
    if (d <= 0) return;
    player.currentTime = (ratio * d) / 1000;
    setProgress(ratio);
    if (ratio < 0.999) setEnded(false);
  };

  const unlocked = item.watchCompleted || watch.completed;
  const quizLabel =
    item.isMine || item.questionCount === 0
      ? null
      : unlocked
        ? "Soruları çöz, kredi kazan"
        : "Video bitince sorular açılır";

  return (
    <ReelChrome
      width={p.width}
      height={p.height}
      topInset={p.topInset}
      bottomOffset={p.bottomOffset}
      title={item.title}
      courseName={item.courseName}
      creatorName={item.creatorName}
      creatorInitials={initialsOf(item.creatorName)}
      creatorColor={colorFor(item.creatorId)}
      creatorAvatarUrl={item.creatorAvatarUrl ? absoluteUrl(item.creatorAvatarUrl) : null}
      saved={item.saved}
      learned={item.learned}
      progress={progress}
      paused={!playing && !ended && running}
      unlocked={unlocked}
      ended={ended}
      quizLabel={quizLabel}
      onTogglePlay={toggle}
      onLearn={() => p.onLearn(item, unlocked)}
      onSave={() => p.onSave(item)}
      onShare={() => p.onShare(item)}
      onQuiz={() => p.onQuiz(item)}
      onReplay={replay}
      onSeek={seek}
      onBack={p.onBack}
      onDragStart={() => {
        player.pause();
        p.onDragStart();
      }}
      onDragEnd={() => {
        p.onDragEnd();
        if (!userPaused.current && !ended) player.play();
      }}
    >
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
      />
    </ReelChrome>
  );
}
