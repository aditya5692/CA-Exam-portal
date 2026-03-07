"use client";

import { useSyncExternalStore } from "react";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  prompt: string;
  options: QuestionOption[];
}

interface ExamState {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  timeRemaining: number;
  status: "idle" | "loading" | "running" | "submitting" | "finished";
  initializeExam: (questions: Question[], durationMinutes: number) => void;
  setCurrentQuestion: (index: number) => void;
  setAnswer: (questionId: string, answerId: string) => void;
  tick: () => void;
  finishExam: () => void;
}

type StatePatch = Partial<ExamState> | ((currentState: ExamState) => Partial<ExamState>);
type StoreListener = () => void;

const listeners = new Set<StoreListener>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function createExamState(): ExamState {
  return {
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    timeRemaining: 0,
    status: "idle",
    initializeExam: (questions, durationMinutes) => {
      setState({
        questions,
        currentQuestionIndex: 0,
        answers: {},
        timeRemaining: durationMinutes * 60,
        status: "running",
      });
    },
    setCurrentQuestion: (index) => {
      const currentState = getState();
      if (index >= 0 && index < currentState.questions.length) {
        setState({ currentQuestionIndex: index });
      }
    },
    setAnswer: (questionId, answerId) => {
      setState((currentState) => ({
        answers: {
          ...currentState.answers,
          [questionId]: answerId,
        },
      }));
    },
    tick: () => {
      setState((currentState) => {
        const nextTimeRemaining = currentState.timeRemaining - 1;
        if (nextTimeRemaining <= 0) {
          return {
            timeRemaining: 0,
            status: "finished",
          };
        }

        return {
          timeRemaining: nextTimeRemaining,
        };
      });
    },
    finishExam: () => {
      setState({ status: "finished" });
    },
  };
}

let state = createExamState();

function getState() {
  return state;
}

function setState(patch: StatePatch) {
  const nextPatch = typeof patch === "function" ? patch(state) : patch;
  state = {
    ...state,
    ...nextPatch,
  };
  notifyListeners();
}

function subscribe(listener: StoreListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetExamStore() {
  state = createExamState();
  notifyListeners();
}

export function useExamStore(): ExamState;
export function useExamStore<T>(selector: (state: ExamState) => T): T;
export function useExamStore<T>(selector?: (state: ExamState) => T) {
  const snapshot = useSyncExternalStore(subscribe, getState, getState);
  return selector ? selector(snapshot) : snapshot;
}