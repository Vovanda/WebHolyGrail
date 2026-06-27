'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { BlockNode, SiteSettings } from 'contracts';

/**
 * InstallSnippet — терминальная команда с copy-кнопкой.
 *
 * @remarks
 * 'use client' нужен потому что есть интерактивный copy-state. Сам terminal-блок
 * рендерится как обычный <code>, JS только для clipboard-action.
 */

export interface InstallSnippetData {
  readonly command?: string;
  readonly caption?: string;
}

export function InstallSnippet({
  node,
}: {
  readonly node: BlockNode & { data?: InstallSnippetData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const command = data.command ?? 'gh repo create my-site --template Vovanda/WebHolyGrail';
  const caption = data.caption;

  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <section className="bg-page-bg pt-6 md:pt-10 pb-10 md:pb-14">
      <div className="mx-auto max-w-content px-4 md:px-6">
        <div className="group relative rounded-lg bg-dark-block px-6 md:px-7 py-5 md:py-6 shadow-lg border border-white/10 ring-1 ring-accent/20">
          <code className="block font-mono text-sm md:text-base text-dark-block-fg pr-12 overflow-x-auto leading-relaxed">
            <span className="text-muted select-none">$ </span>
            {command}
          </code>
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? 'Скопировано' : 'Скопировать команду'}
            className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-dark-block-fg/70 hover:text-dark-block-fg hover:bg-white/10 transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        {caption && <p className="mt-3 text-center text-sm text-muted">{caption}</p>}
      </div>
    </section>
  );
}
