import dotenv from 'dotenv';
dotenv.config();

import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { supervisorDecision } from './agents/supervisor.js';
import { retrieveContext } from './agents/retriever.js';
import { generateAnswer } from './agents/generator.js';
import { securityCheck } from './agents/security.js';
import { reviewPR } from './agents/reviewer/index.js';
import { getMockDiff } from './utils/github-fallback.js';

// ---------------------------------------------------------------------------
// Состояние
// ---------------------------------------------------------------------------

const AgentState = Annotation.Root({
  question: Annotation<string>({ reducer: (_, next) => next ?? '' }),
  context: Annotation<string>({ reducer: (_, next) => next ?? '' }),
  answer: Annotation<string>({ reducer: (_, next) => next ?? '' }),
  mode: Annotation<'ask' | 'review'>({ reducer: (_, next) => next ?? 'ask' }),
  prNumber: Annotation<number>({ reducer: (_, next) => next ?? 0 }),
  reviewResult: Annotation<string>({ reducer: (_, next) => next ?? '' }),
  securityDone: Annotation<boolean>({ reducer: (_, next) => next ?? false }),
  securityPassed: Annotation<boolean>({ reducer: (_, next) => next ?? true }),
  reviewDone: Annotation<boolean>({ reducer: (_, next) => next ?? false }),
  supervisorRoute: Annotation<string>({ reducer: (_, next) => next ?? '' }),
});

type AgentStateType = typeof AgentState.State;

// ---------------------------------------------------------------------------
// supervisor
// ---------------------------------------------------------------------------

async function supervisorNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const route = await supervisorDecision({
    mode: state.mode,
    prNumber: state.prNumber,
    question: state.question,
    securityDone: state.securityDone,
    securityPassed: state.securityPassed,
    reviewDone: state.reviewDone,
    reviewResult: state.reviewResult,
  });
  return { supervisorRoute: route };
}

// ---------------------------------------------------------------------------
// security
// ---------------------------------------------------------------------------

async function securityNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const files = getMockDiff();
  const result = await securityCheck(files);

  if (!result.passed) {
    return {
      securityDone: true,
      securityPassed: false,
      reviewResult: `⛔ Запрос заблокирован: ${result.reason}`,
    };
  }

  return { securityDone: true, securityPassed: true };
}

// ---------------------------------------------------------------------------
// retrieve
// ---------------------------------------------------------------------------

async function retrieveNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  if (state.mode === 'review' && state.reviewResult) {
    return { context: state.reviewResult };
  }

  const context = await retrieveContext(state.question);
  return { context };
}

// ---------------------------------------------------------------------------
// generate
// ---------------------------------------------------------------------------

async function generateNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const question = state.mode === 'review'
    ? 'Подведи итоги код-ревью и перечисли найденные нарушения'
    : state.question;

  const answer = await generateAnswer(question, state.context);
  return { answer };
}

// ---------------------------------------------------------------------------
// analyze_diff
// ---------------------------------------------------------------------------

async function analyzeDiffNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const result = await reviewPR({ prNumber: state.prNumber });
  return {
    reviewResult: result.reviewResult,
    reviewDone: result.reviewDone,
  };
}

// ---------------------------------------------------------------------------
// routing
// ---------------------------------------------------------------------------

function routeAfterSupervisor(state: AgentStateType): 'security' | 'retrieve' | 'analyze_diff' | '__end__' {
  switch (state.supervisorRoute) {
    case 'security': return 'security';
    case 'retrieve': return 'retrieve';
    case 'analyze_diff': return 'analyze_diff';
    case 'done': return '__end__';
    default: return '__end__';
  }
}

function routeAfterSecurity(state: AgentStateType): 'supervisor' | '__end__' {
  return state.securityPassed ? 'supervisor' : '__end__';
}

function routeAfterReview(state: AgentStateType): 'supervisor' {
  return 'supervisor';
}

// ---------------------------------------------------------------------------
// Граф
// ---------------------------------------------------------------------------

const workflow = new StateGraph(AgentState)
  .addNode('supervisor', supervisorNode)
  .addNode('security', securityNode)
  .addNode('retrieve', retrieveNode)
  .addNode('generate', generateNode)
  .addNode('analyze_diff', analyzeDiffNode)
  .addEdge(START, 'supervisor')
  .addConditionalEdges('supervisor', routeAfterSupervisor, {
    security: 'security',
    retrieve: 'retrieve',
    analyze_diff: 'analyze_diff',
    __end__: END,
  })
  .addConditionalEdges('security', routeAfterSecurity, {
    supervisor: 'supervisor',
    __end__: END,
  })
  .addConditionalEdges('analyze_diff', routeAfterReview, {
    supervisor: 'supervisor',
  })
  .addEdge('retrieve', 'generate')
  .addEdge('generate', END);

export const graph = workflow.compile();
