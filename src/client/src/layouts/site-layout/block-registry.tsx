import type { ReactNode } from 'react';
import type { BlockNode, SiteSettings } from 'contracts';

import { ProjectTypesGrid } from '@/blocks/domain/whg/ProjectTypesGrid';
import { BlockShowcase } from '@/blocks/domain/whg/BlockShowcase';
import { DemoAccessSection } from '@/blocks/domain/whg/DemoAccessSection';
import { SpecialistDirectory } from '@/blocks/domain/whg/SpecialistDirectory';
import { SpecialistProfile } from '@/blocks/domain/whg/SpecialistProfile';
import { engineRegistry, renderBlockNode as renderEngineBlock } from './block-registry.engine';

/**
 * Точка сборки реестра блоков. Принадлежит сайту.
 *
 * @remarks
 * Сперва всё из движка, ниже свои доменные блоки. Обновление этот файл не трогает,
 * поэтому регистрация доменного блока живёт вечно, а новый общий блок доезжает
 * сам вместе с набором.
 */
type BlockRenderer = (node: BlockNode, settings: SiteSettings, children?: ReactNode) => ReactNode;

const REGISTRY: Record<string, BlockRenderer> = {
  ...engineRegistry,
  'project-types-grid': (node, settings) => <ProjectTypesGrid node={node} settings={settings} />,
  'block-showcase': (node, settings) => <BlockShowcase node={node} settings={settings} />,
  demoAccess: (node) => <DemoAccessSection node={node} />,
  'specialist-directory': (node, settings) => (
    <SpecialistDirectory node={node} settings={settings} />
  ),
  'specialist-profile': (node, settings) => <SpecialistProfile node={node} settings={settings} />,
};

export function renderBlockNode(
  node: BlockNode,
  settings: SiteSettings,
  children?: ReactNode,
): ReactNode {
  return renderEngineBlock(node, settings, children, REGISTRY);
}
