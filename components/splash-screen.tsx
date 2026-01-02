"use client"

import { motion } from "framer-motion"
import { Coffee } from "lucide-react"
import Image from "next/image"
import { useMemo, useState, useEffect } from "react"

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAnimationComplete = () => {
    setTimeout(() => {
      onComplete()
    }, 3500)
  }

  const beans = useMemo(() => {
    if (!mounted) return []
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1,
      rotation: Math.random() * 360,
      duration: 2.5 + Math.random() * 1.5,
    }))
  }, [mounted])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      onAnimationComplete={handleAnimationComplete}
    >
      {/* Coffee beans falling animation */}
      {beans.map((bean) => (
        <motion.div
          key={bean.id}
          className="absolute text-primary-foreground z-0"
          initial={{
            top: "-10%",
            left: `${bean.x}%`,
            opacity: 0,
            rotate: bean.rotation,
          }}
          animate={{
            top: "110%",
            opacity: [0, 1, 1, 1, 0],
            rotate: bean.rotation + 720,
          }}
          transition={{
            duration: bean.duration,
            delay: bean.delay,
            ease: "easeIn",
          }}
        >
          <Coffee size={24} className="fill-current" />
        </motion.div>
      ))}

      <motion.div
        className="relative z-10 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <Image
          src="/images/image.png"
          alt="Coffee & Code Logo"
          width={150}
          height={150}
          className="w-40 h-40 object-contain rounded-3xl"
          priority
        />
      </motion.div>
    </motion.div>
  )
}
