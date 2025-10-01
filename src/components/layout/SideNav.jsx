import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function SideNav() {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    materials: location.pathname.startsWith('/materials'),
    stock: location.pathname.startsWith('/stock'),
    requests: location.pathname.startsWith('/requests'),
    optimization: location.pathname.startsWith('/optimization')
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { 
      section: 'materials', 
      label: 'Materiali',
      subLinks: [
        { href: '/materials/list', label: 'Lista Materiali' },
        { href: '/materials/new', label: 'Nuovo Materiale' }
      ]
    },
    { 
      section: 'stock', 
      label: 'Magazzino',
      subLinks: [
        { href: '/stock/list', label: 'Lista Bobine' },
        { href: '/stock/new', label: 'Nuova Bobina' }
      ]
    },
    { 
      section: 'requests', 
      label: 'Richieste',
      subLinks: [
        { href: '/requests/list', label: 'Lista Richieste' },
        { href: '/requests/new', label: 'Nuova Richiesta' }
      ]
    },
    { 
      section: 'optimization', 
      label: 'Ottimizzazione',
      subLinks: [
        { href: '/optimization', label: 'Calcolo Ottimizzazione' }
      ]
    }
  ];

  return (
    <nav className="w-48 bg-navy-800 border-r border-navy-700 h-screen flex flex-col flex-shrink-0 sticky left-0 z-30">
      {/* Logo */}
      <div className="p-3 border-b border-navy-700">
        <Link to="/" className="flex items-center justify-center">
          <div className="text-white font-bold text-lg">OptiCUT Pro</div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-1">
        <h3 className="text-[10px] font-semibold text-navy-200 uppercase tracking-wider mb-3">NAVIGATION</h3>
        <div className="space-y-1">
          {navLinks.map((link) => {
            if (link.section) {
              // Expandable section with sub-links
              const isExpanded = expandedSections[link.section];
              const hasActiveSubLink = link.subLinks.some(subLink => location.pathname === subLink.href);
              
              return (
                <div key={link.section}>
                  <button
                    onClick={() => toggleSection(link.section)}
                    className={`w-full flex items-center justify-between px-1 py-1.5 rounded text-[10px] font-medium ${
                      hasActiveSubLink 
                        ? 'bg-navy-600 text-white' 
                        : 'text-navy-200 hover:bg-navy-700'
                    }`}
                  >
                    <span className="flex items-center">
                      {link.label}
                    </span>
                    <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="ml-3 mt-1 space-y-1">
                      {link.subLinks.map((subLink) => {
                        const isActive = location.pathname === subLink.href;
                        return (
                          <Link
                            key={subLink.href}
                            to={subLink.href}
                            className={`block px-1 py-1 rounded text-[9px] font-medium ${
                              isActive 
                                ? 'bg-navy-500 text-white' 
                                : 'text-navy-300 hover:bg-navy-600 hover:text-white'
                            }`}
                          >
                            {subLink.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            } else {
              // Regular link
              const isActive = location.pathname === link.href;
              
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`block px-1 py-1.5 rounded text-[10px] font-medium ${
                    isActive 
                      ? 'bg-navy-600 text-white' 
                      : 'text-navy-200 hover:bg-navy-700'
                  }`}
                >
                  <span className="flex items-center">
                    {link.label}
                  </span>
                </Link>
              );
            }
          })}
        </div>
      </div>

    </nav>
  );
}

export default SideNav;