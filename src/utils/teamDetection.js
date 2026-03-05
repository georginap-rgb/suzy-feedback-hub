export const TEAM_KEYWORDS = {
  intelligence: ['signals', 'chat', 'user context', 'suzyq', 'ask suzy', 'mcp', 'agent', 'caching', 'feed', 'ai-generated', 'image'],
  insights: ['survey', 'study', 'speaks', 'suzy speaks', 'response', 'results', 'launch', 'questionnaire', 'participant'],
  impact: ['stories', 'story', 'output', 'report', 'brief', 'creative', 'export', 'slides'],
  data: ['data', 'db', 'database', 'segment', 'tracking', 'analytics', 'pipeline', 'sync', 'brand', 'env', 'schema'],
}

export function detectTeam(text) {
  const lower = text.toLowerCase()
  let bestTeam = 'data'
  let bestScore = 0

  for (const [team, keywords] of Object.entries(TEAM_KEYWORDS)) {
    const score = keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0)
    if (score > bestScore) {
      bestScore = score
      bestTeam = team
    }
  }

  return bestTeam
}

export const TEAM_ASSIGNEES = {
  intelligence: ['@georginap', '@roopy'],
  insights: ['@maxkelly', '@bala-natrayan', '@georgebloom'],
  impact: ['@erikabailey', '@haseebsaeed'],
  data: ['@richezamor', '@eman-elgouz', '@zachkrepps'],
}

export const TEAM_COLORS = {
  intelligence: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/30' },
  insights: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  impact: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  data: { text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30' },
}

export const CATEGORY_TO_TYPE = {
  'Bug Report': 'Bug',
  'Feature Request': 'Feature',
  'Process Issue': 'Task',
}

export const DEFAULT_TEAM_MAPPING = [
  {
    team: 'intelligence',
    keywords: 'signals, chat, user context, suzyq, ask suzy, mcp, agent, caching, feed, ai-generated, image',
    pms: 'Georgina P',
    handles: '@georginap, @roopy',
  },
  {
    team: 'insights',
    keywords: 'survey, study, speaks, suzy speaks, response, results, launch, questionnaire, participant',
    pms: 'Max Kelly, Bala N, George B',
    handles: '@maxkelly, @bala-natrayan, @georgebloom',
  },
  {
    team: 'impact',
    keywords: 'stories, story, output, report, brief, creative, export, slides',
    pms: 'Erika B, Haseeb S',
    handles: '@erikabailey, @haseebsaeed',
  },
  {
    team: 'data',
    keywords: 'data, db, database, segment, tracking, analytics, pipeline, sync, brand, env, schema',
    pms: 'Richeza Z, Eman E',
    handles: '@richezamor, @eman-elgouz, @zachkrepps',
  },
]
