import React from 'react';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  alignment?: 'left' | 'center' | 'right';
}

export const SectionHeading = ({ title, subtitle, alignment = 'left' }: SectionHeadingProps) => {
  const alignmentClass = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto',
  };

  return (
    <div className={`mb-12 max-w-3xl ${alignmentClass[alignment]}`}>
      <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">{title}</h2>
      {subtitle && <p className="text-stone-600 text-lg leading-relaxed">{subtitle}</p>}
    </div>
  );
};
