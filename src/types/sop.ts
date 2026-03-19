export interface TrainingModule {
  learning_objective: string;
  what_to_do: string;
  why_it_matters: string;
  example: string;
  common_mistake: string;
  prerequisite: string;
}

export interface DecisionScenario {
  situation: string;
  decision: string;
  reasoning: string;
}

export interface QuizQuestion {
  type: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface SOPAnalysis {
  sop_type: string;
  audience: string;
  complexity: string;
}

export interface SOPResult {
  analysis: SOPAnalysis;
  overview: string;
  training_modules: TrainingModule[];
  decision_scenarios: DecisionScenario[];
  quiz: QuizQuestion[];
}
