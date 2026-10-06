/// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import BrandIcon from './BrandIcon';

// JUS-467: one shared component for the in-app Bond logo
describe('BrandIcon', () => {
  afterEach(cleanup);

  it('renders the shield app tile with an accessible name', () => {
    render(<BrandIcon />);
    const img = screen.getByRole('img', { name: 'Bond' });
    expect(img.getAttribute('src')).toBe('/bond-icon.svg');
  });

  it('is sized by the bundled .brand-icon class, not by Tailwind utilities', () => {
    render(<BrandIcon />);
    const img = screen.getByRole('img', { name: 'Bond' });
    expect(img.classList.contains('brand-icon')).toBe(true);
    expect(img.className).not.toMatch(/\b(w|h)-\d/);
  });

  it('cannot be dragged off on touch devices', () => {
    render(<BrandIcon />);
    expect(screen.getByRole('img', { name: 'Bond' }).getAttribute('draggable')).toBe('false');
  });

  it('keeps extra classes passed by the caller', () => {
    render(<BrandIcon className="mb-4" />);
    const img = screen.getByRole('img', { name: 'Bond' });
    expect(img.className).toBe('brand-icon mb-4');
  });
});
