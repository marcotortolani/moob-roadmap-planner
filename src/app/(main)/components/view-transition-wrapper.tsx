import { ReactNode, useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence, type Transition } from 'framer-motion'

const slideVariants = {
  enterFromRight: {
    x: '100%',
    opacity: 0,
  },
  enterFromLeft: {
    x: '-100%',
    opacity: 0,
  },
  center: {
    x: 0,
    opacity: 1,
  },
  exitToRight: {
    x: '100%',
    opacity: 0,
  },
  exitToLeft: {
    x: '-100%',
    opacity: 0,
  },
}

const slideTransition: Transition = {
  type: 'tween',
  ease: [0.4, 0, 0.2, 1],
  duration: 0.4,
}

interface ViewTransitionWrapperProps {
  view: string
  children: ReactNode
}

export function ViewTransitionWrapper({
  view,
  children,
}: ViewTransitionWrapperProps) {
  const [previousView, setPreviousView] = useState(view)

  useEffect(() => {
    setPreviousView(view)
  }, [view])

  // Determinar las animaciones según la transición
  const getAnimationProps = useMemo(() => {
    const goingToCalendar = previousView === 'list' && view === 'calendar'
    const goingToList = previousView === 'calendar' && view === 'list'

    if (view === 'list') {
      // Lista siempre entra desde la izquierda y sale hacia la izquierda
      return {
        initial: goingToList ? 'enterFromLeft' : 'center',
        animate: 'center',
        exit: 'exitToLeft',
      }
    } else {
      // Calendario siempre entra desde la derecha y sale hacia la derecha
      return {
        initial: goingToCalendar ? 'enterFromRight' : 'center',
        animate: 'center',
        exit: 'exitToRight',
      }
    }
  }, [view, previousView])

  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.div
        key={view}
        variants={slideVariants}
        {...getAnimationProps}
        transition={slideTransition}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
