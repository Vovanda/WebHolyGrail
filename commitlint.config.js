/**
 * Commitlint config. Enforces conventional commits per .claude/skills/git-style.
 *
 * Allowed types: feat (production code), fix, refactor, test, docs, chore, perf, ci, build, style.
 * Scopes are case-insensitive, free-form (client/cms/contracts/deploy/claude/<block> ...).
 * Header max length is 100 characters — keep the summary tight.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'test',
        'docs',
        'chore',
        'perf',
        'ci',
        'build',
        'style',
        'revert',
      ],
    ],
    'scope-case': [0],
    'subject-case': [0],
  },
};
