import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { Algorithm, Step } from '@lib/types'
import type { Locale } from '@i18n/translations'
import {
  getSessionGraph,
  getSessionGraphIdFromExampleId,
  graphToState,
  isSessionGraphExampleId,
} from '@lib/sessionGraphs'

export const SPEED_MAP: Record<number, number> = {
  1: 1500,
  2: 800,
  3: 400,
  4: 150,
  5: 50,
}

export function usePlayback(locale: Locale, initialAlgorithm?: Algorithm | null) {
  const [selectedSourceNodeId, setSelectedSourceNodeId] = useState<number | null>(null)

  const getSteps = useCallback(
    (algorithm: Algorithm, exampleId?: string | null, sourceNodeId?: number | null): Step[] => {
      if (isSessionGraphExampleId(exampleId)) {
        const graph = getSessionGraph(getSessionGraphIdFromExampleId(exampleId))
        if (!graph) return []
        const graphState = graphToState(graph)
        // Add sourceNodeId if a custom source was selected
        if (sourceNodeId != null) {
          graphState.sourceNodeId = sourceNodeId
        }
        return algorithm.generateSteps(locale, undefined, graphState)
      }
      // For predefined examples, also pass sourceNodeId if available
      if (sourceNodeId != null) {
        return algorithm.generateSteps(locale, exampleId ?? undefined, { 
          nodes: [], 
          edges: [], 
          sourceNodeId 
        })
      }
      return algorithm.generateSteps(locale, exampleId ?? undefined)
    },
    [locale],
  )

  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm | null>(initialAlgorithm ?? null)
  const [selectedExampleId, setSelectedExampleId] = useState<string | null>(
    initialAlgorithm?.examples?.[0]?.id ?? null,
  )
  const [steps, setSteps] = useState<Step[]>(() =>
    initialAlgorithm
      ? getSteps(initialAlgorithm, initialAlgorithm.examples?.[0]?.id)
      : [],
  )
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(2)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAutoplayTimer = useCallback(() => {
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current)
      autoplayTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (initialAlgorithm && steps.length > 0) {
      autoplayTimerRef.current = setTimeout(() => setIsPlaying(true), 800)
    }
    return clearAutoplayTimer
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectAlgorithm = useCallback((algo: Algorithm) => {
    clearAutoplayTimer()
    setIsPlaying(false)
    setSelectedAlgorithm(algo)
    const exampleId = algo.examples?.[0]?.id ?? null
    setSelectedExampleId(exampleId)
    const newSteps = getSteps(algo, exampleId)
    setSteps(newSteps)
    setCurrentStep(0)
    autoplayTimerRef.current = setTimeout(() => setIsPlaying(true), 600)
  }, [clearAutoplayTimer, getSteps])

  const selectExample = useCallback((exampleId: string, sourceNodeId?: number | null) => {
    if (!selectedAlgorithm) return
    clearAutoplayTimer()
    setIsPlaying(false)
    setSelectedExampleId(exampleId)
    // Update selected source node if provided
    if (sourceNodeId != null) {
      setSelectedSourceNodeId(sourceNodeId)
    } else {
      setSelectedSourceNodeId(null) // Reset when selecting new example
    }
    setSteps(getSteps(selectedAlgorithm, exampleId, sourceNodeId ?? null))
    setCurrentStep(0)
  }, [selectedAlgorithm, clearAutoplayTimer, getSteps])

  const stepForward = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }, [steps.length])

  const stepBackward = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }, [])

  const togglePlay = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= steps.length - 1) {
        setIsPlaying(true)
        return 0
      }
      setIsPlaying((p) => !p)
      return prev
    })
  }, [steps.length])

  const pause = useCallback(() => {
    clearAutoplayTimer()
    setIsPlaying(false)
  }, [clearAutoplayTimer])

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (isPlaying && steps.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, SPEED_MAP[speed] || 400)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, speed, steps.length])

  const clearSelection = useCallback(() => {
    clearAutoplayTimer()
    setIsPlaying(false)
    setSelectedAlgorithm(null)
    setSelectedExampleId(null)
    setSteps([])
    setCurrentStep(0)
  }, [clearAutoplayTimer])

  const rawCurrentStepData = steps[currentStep] || null
  const currentStepData = useMemo(() => {
    if (!rawCurrentStepData?.graph || currentStep < steps.length - 1) return rawCurrentStepData
    return {
      ...rawCurrentStepData,
      graph: {
        ...rawCurrentStepData.graph,
        currentNode: null,
        currentEdge: null,
      },
    }
  }, [currentStep, rawCurrentStepData, steps.length])

  return {
    selectedAlgorithm,
    selectedExampleId,
    steps,
    currentStep,
    setCurrentStep,
    isPlaying,
    speed,
    setSpeed,
    selectAlgorithm,
    selectExample,
    clearSelection,
    stepForward,
    stepBackward,
    togglePlay,
    pause,
    currentStepData,
    selectedSourceNodeId,
    setSelectedSourceNodeId,
  }
}
