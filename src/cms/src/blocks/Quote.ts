import type { Block } from 'payload';

/**
 * Quote / Testimonial — a quote with an attribution.
 * Can be an "About us" block (with author photo) or a customer testimonial.
 */
export const QuoteBlock: Block = {
  slug: 'quote',
  labels: { singular: 'Quote / Testimonial', plural: 'Quotes' },
  fields: [
    {
      name: 'heading',
      label: 'Section heading (optional)',
      type: 'text',
      defaultValue: 'About us',
    },
    { name: 'body', label: 'Quote text', type: 'textarea', required: true },
    { name: 'author', label: 'Author', type: 'text', required: true },
    { name: 'role', label: 'Role / title', type: 'text' },
    {
      name: 'photoUrls',
      label: 'Author photo (one or more → carousel)',
      type: 'array',
      labels: { singular: 'Photo', plural: 'Photos' },
      admin: {
        description:
          'If more than one — rotates in a carousel (5s auto-advance), with arrows and swipe.',
      },
      fields: [
        {
          name: 'url',
          label: 'URL',
          type: 'text',
          required: true,
          admin: { description: 'Public URL of the image (e.g. https://cdn.example.com/img.jpg).' },
        },
      ],
    },
    {
      name: 'variant',
      label: 'Design variant',
      type: 'select',
      defaultValue: 'card-accent-left',
      options: [
        { label: 'Card with accent stripe (with photo)', value: 'card-accent-left' },
        { label: 'Minimal (no photo, no card)', value: 'minimal-modern' },
        { label: 'Photo card (customer testimonial)', value: 'photo-card' },
        { label: 'Full-width dark (marketing manifesto)', value: 'full-width-dark' },
      ],
    },
    {
      name: 'authorHref',
      label: 'Author link (optional)',
      type: 'text',
      admin: {
        description:
          'If set, author attribution becomes a link (e.g. GitHub profile, personal site).',
      },
    },
  ],
};
