"use client";

import type { Transition } from "motion/react";
import { motion } from "motion/react";

import { SITE } from "@/constants/site";

interface UserAvatarProps {
  layoutId?: string;
  layoutTransition?: Transition;
  size?: number;
}

export const UserAvatar = ({
  layoutId,
  layoutTransition,
  size = 60,
}: UserAvatarProps) => (
  <motion.div
    className="relative h-fit w-fit shrink-0"
    layoutId={layoutId}
    style={{ height: size, width: size }}
    transition={{ layout: layoutTransition }}
  >
    <img
      src={SITE.AUTHOR.AVATAR}
      alt="Portrait of Dev Shakya"
      width={size}
      height={size}
      className="size-full rounded-full object-cover"
      fetchPriority="high"
    />
  </motion.div>
);
