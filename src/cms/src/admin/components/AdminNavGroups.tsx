'use client';

import { getTranslation } from '@payloadcms/translations';
import {
  BrowseByFolderButton,
  ChevronIcon,
  Link,
  useConfig,
  usePreferences,
  useTranslation,
} from '@payloadcms/ui';
import type { NavGroupType } from '@payloadcms/ui/shared';
import { usePathname } from 'next/navigation';
import type { NavPreferences } from 'payload';
import { formatAdminURL, PREFERENCE_KEYS } from 'payload/shared';
import { useState } from 'react';

/**
 * Группы меню админки: заголовок раскрывает пункты сразу, без анимации.
 *
 * @remarks
 * Штатная группа Payload раскрывается с анимацией высоты, и выключить её можно
 * только правилами по внутренним классам. Своя группа пишет раскрытие в ту же
 * настройку пользователя (`PREFERENCE_KEYS.NAV`), поэтому выбор, сделанный
 * в штатном меню, сохраняется. Вид - на токенах темы админки.
 */
export function AdminNavGroups({
  groups,
  navPreferences,
}: {
  readonly groups: NavGroupType[];
  readonly navPreferences: NavPreferences;
}) {
  const pathname = usePathname();
  const { config } = useConfig();
  const { i18n } = useTranslation();
  const adminRoute = config.routes.admin;
  const folders = config.folders && config.folders.browseByFolder;
  const folderURL = formatAdminURL({ adminRoute, path: config.admin.routes.browseByFolder });

  return (
    <>
      {folders && <BrowseByFolderButton active={pathname.startsWith(folderURL)} />}
      {groups.map((group) => (
        <AdminNavGroup
          key={group.label}
          label={group.label}
          initiallyOpen={navPreferences.groups?.[group.label]?.open ?? true}
        >
          {group.entities.map(({ slug, type, label }) => {
            const path: `/${string}` =
              type === 'collections' ? `/collections/${slug}` : `/globals/${slug}`;
            const href = formatAdminURL({ adminRoute, path });
            const active =
              pathname.startsWith(href) && ['/', undefined].includes(pathname[href.length]);
            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                aria-current={active ? 'page' : undefined}
                data-part="nav-link"
                style={{
                  position: 'relative',
                  display: 'block',
                  padding: '.3rem 0 .3rem calc(var(--base, 20px) * 0.75)',
                  color: 'var(--theme-text)',
                  fontWeight: active ? 600 : 400,
                  textDecoration: 'none',
                }}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: 'calc(var(--base, 20px) * -1)',
                      top: '.3rem',
                      bottom: '.3rem',
                      width: 2,
                      background: 'var(--theme-text)',
                    }}
                  />
                )}
                {getTranslation(label, i18n)}
              </Link>
            );
          })}
        </AdminNavGroup>
      ))}
    </>
  );
}

function AdminNavGroup({
  label,
  initiallyOpen,
  children,
}: {
  readonly label: string;
  readonly initiallyOpen: boolean;
  readonly children: React.ReactNode;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const { setPreference } = usePreferences();

  function toggle() {
    setOpen(!open);
    void setPreference(PREFERENCE_KEYS.NAV, { groups: { [label]: { open: !open } } }, true);
  }

  return (
    <div data-part="nav-group" style={{ width: '100%', marginBottom: '.75rem' }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={toggle}
        data-part="nav-group-toggle"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '.3rem 0',
          border: 0,
          background: 'transparent',
          color: 'var(--theme-elevation-400)',
          cursor: 'pointer',
          font: 'inherit',
          textAlign: 'left',
        }}
      >
        <span>{label}</span>
        <ChevronIcon direction={open ? 'up' : 'down'} size="small" />
      </button>
      {open && <div data-part="nav-group-items">{children}</div>}
    </div>
  );
}
