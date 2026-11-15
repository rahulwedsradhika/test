import React from 'react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  id: string;
  name_en: string;
  name_hi?: string | null;
  type?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-xs text-[#64746D] overflow-x-auto py-2.5 mb-4">
      <Link to="/" className="hover:text-[#1A5344] flex items-center gap-1 font-medium shrink-0">
        <i className="fa-solid fa-house text-[10px]"></i>
        <span>Home</span>
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        let targetUrl = '/';
        if (item.type === 'samhita') {
          targetUrl = `/samhita/${item.id}`;
        } else if (item.type === 'division' || item.type === 'miscellaneous_group') {
          targetUrl = `/division/${item.id}`;
        } else if (item.type === 'chapter' || item.type === 'miscellaneous') {
          targetUrl = `/chapter/${item.id}`;
        }

        return (
          <React.Fragment key={item.id}>
            <i className="fa-solid fa-chevron-right text-[9px] text-[#A39B8C] shrink-0"></i>
            {isLast ? (
              <span className="font-semibold text-[#1A5344] shrink-0">
                {item.name_en} {item.name_hi && <span className="font-sanskrit">({item.name_hi})</span>}
              </span>
            ) : (
              <Link to={targetUrl} className="hover:text-[#1A5344] shrink-0">
                {item.name_en}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
