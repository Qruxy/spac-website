'use client';

/**
 * StarBorder Component
 *
 * Button/container with animated star border effect.
 * Perfect for CTAs in astronomy-themed sites!
 * Ported from React Bits library.
 */

import React, { ElementType, ComponentPropsWithoutRef } from 'react';

type StarBorderProps<T extends ElementType = 'button'> = ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: string;
  thickness?: number;
};

export function StarBorder<T extends ElementType = 'button'>({
  as,
  className = '',
  color = '#818cf8', // Indigo-400 to match theme
  speed = '6s',
  thickness = 1,
  children,
  ...rest
}: StarBorderProps<T>) {
  const Component = as || 'button';

  return (
    <Component
      className={`group relative inline-block overflow-hidden rounded-xl ${className}`}
      {...(rest as ComponentPropsWithoutRef<T>)}
      style={{
        padding: `${thickness}px 0`,
        ...(rest.style as React.CSSProperties)
      }}
    >
      {/* Bottom star movement */}
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-[star-movement-bottom_linear_infinite_alternate] z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      />
      {/* Top star movement */}
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-[star-movement-top_linear_infinite_alternate] z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      />
      {/* Content */}
      <div className="relative z-10 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/50 text-white text-center py-3 px-6 rounded-xl group-hover:border-indigo-500/50 transition-colors">
        {children}
      </div>
    </Component>
  );
}

export default StarBorder;
