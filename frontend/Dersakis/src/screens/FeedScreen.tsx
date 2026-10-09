import React, { RefObject } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from "react-native";
import { C } from "@/theme";
import type { Reel } from "@/types";
import { ReelCard } from "@/components/reels";

export type FeedScreenProps = {
  feedRef: RefObject<ScrollView | null>;
  reels: Reel[];
  width: number;
  height: number;
  topInset: number;
  bottomOffset: number;
  safeIndex: number;
  progress: number;
  playing: boolean;
  finished: string[];
  learned: string[];
  saved: string[];
  onScrollEnd: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onTogglePlay: (idx: number) => void;
  onLearn: (id: string) => void;
  onSave: (id: string) => void;
  onShare: () => void;
  onQuiz: () => void;
  onReplay: (id: string) => void;
  onSeek: (p: number) => void;
  onBack: () => void;
};

export function FeedScreen(p: FeedScreenProps) {
  return (
    <View style={{ flex: 1, backgroundColor: C.abyss }}>
      <ScrollView
        ref={p.feedRef}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={p.onScrollEnd}
      >
        {p.reels.map((reel, idx) => (
          <ReelCard
            key={reel.id}
            reel={reel}
            width={p.width}
            height={p.height}
            topInset={p.topInset}
            bottomOffset={p.bottomOffset}
            active={idx === p.safeIndex}
            progress={idx === p.safeIndex ? p.progress : 0}
            playing={p.playing}
            finished={p.finished.includes(reel.id)}
            learned={p.learned.includes(reel.id)}
            saved={p.saved.includes(reel.id)}
            onTogglePlay={() => p.onTogglePlay(idx)}
            onLearn={() => p.onLearn(reel.id)}
            onSave={() => p.onSave(reel.id)}
            onShare={p.onShare}
            onQuiz={p.onQuiz}
            onReplay={() => p.onReplay(reel.id)}
            onSeek={p.onSeek}
            onBack={p.onBack}
          />
        ))}
      </ScrollView>
    </View>
  );
}