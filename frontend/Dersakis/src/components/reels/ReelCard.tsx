import React from "react";
import { absoluteUrl } from "@/config";
import type { FeedItem } from "@/api/feed";
import { colorFor, initialsOf } from "@/utils/user";
import type { FeedRow } from "@/utils/feedRows";
import { ActiveReel } from "./ActiveReel";
import { FactCard } from "./FactCard";
import { ReelChrome } from "./ReelChrome";

export type ReelHandlers = {
  onLearn: (item: FeedItem, watched: boolean) => void;
  onSave: (item: FeedItem) => void;
  onShare: (item: FeedItem) => void;
  onQuiz: (item: FeedItem) => void;
  onBack: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  showToast: (m: string) => void;
};

type Props = ReelHandlers & {
  row: FeedRow;
  active: boolean;
  running: boolean;
  width: number;
  height: number;
  topInset: number;
  bottomOffset: number;
};

const noop = () => {};

export function ReelCard({ row, active, running, ...p }: Props) {
  const size = {
    width: p.width,
    height: p.height,
    topInset: p.topInset,
    bottomOffset: p.bottomOffset,
  };

  if (row.kind === "fact") {
    return <FactCard fact={row.fact} onBack={p.onBack} {...size} />;
  }

  const item = row.item;
  if (active) {
    return <ActiveReel item={item} running={running} {...p} {...size} />;
  }

  // ekran dışındaki kartlar oynatıcı tutmaz; sadece iskelet çizilir
  return (
    <ReelChrome
      {...size}
      title={item.title}
      courseName={item.courseName}
      creatorName={item.creatorName}
      creatorInitials={initialsOf(item.creatorName)}
      creatorColor={colorFor(item.creatorId)}
      creatorAvatarUrl={item.creatorAvatarUrl ? absoluteUrl(item.creatorAvatarUrl) : null}
      saved={item.saved}
      learned={item.learned}
      progress={0}
      paused={false}
      unlocked={item.watchCompleted}
      ended={false}
      quizLabel={null}
      onTogglePlay={noop}
      onLearn={noop}
      onSave={noop}
      onShare={noop}
      onQuiz={noop}
      onReplay={noop}
      onSeek={noop}
      onBack={p.onBack}
    />
  );
}
