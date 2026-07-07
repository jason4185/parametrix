"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/Card";

type AnimatedCardProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function AnimatedCard({
  children,
  className = "",
  delay = 0,
}: AnimatedCardProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 8 }}
      transition={{ delay, duration: 0.28 }}
    >
      <Card className={className}>{children}</Card>
    </motion.div>
  );
}
