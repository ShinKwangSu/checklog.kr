import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

export const nextBaseConfig = compat.extends('next/core-web-vitals', 'next/typescript')

// 도메인 배럴(domain/{feature}/index.ts) 강제. 도메인 이름을 모르는 순수 glob이라
// apps/app, apps/admin 양쪽에 그대로 공용으로 쓸 수 있다. checklog.kr CLAUDE.md
// 컨벤션: 도메인 내부(actions/service/repository/queries/hooks/mapper)는 배럴을
// 통해서만 import 한다.
export const domainBarrierConfig = [
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // no-restricted-imports 의 group 패턴은 gitignore 문법(ignore 패키지)을
              // 써서 브레이스 확장({a,b,c})을 지원하지 않는다 — 하위 디렉터리별로 나열.
              group: [
                '@/domain/*/actions/**',
                '@/domain/*/service/**',
                '@/domain/*/repository/**',
                '@/domain/*/queries/**',
                '@/domain/*/hooks/**',
                '@/domain/*/mapper/**',
              ],
              message:
                '도메인 내부 모듈 직접 import 금지. 배럴(@/domain/{feature})을 통해서만 import 하세요.',
            },
          ],
        },
      ],
    },
  },
]
