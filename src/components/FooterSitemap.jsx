import React from 'react';
import { decodeHTMLEntities } from '../utils/formatters';

export default function FooterSitemap({ footerDetails, primaryLanguage, openDetails }) {
  if (
    !footerDetails ||
    (!footerDetails.artists?.length &&
      !footerDetails.actors?.length &&
      !footerDetails.albums?.length &&
      !footerDetails.playlists?.length)
  ) {
    return null;
  }

  const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');
  const langName = capitalize(primaryLanguage);

  return (
    <footer className="mt-16 border-t border-slate-900 bg-slate-950/80 px-4 sm:px-8 py-12 text-slate-400">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {footerDetails.artists?.length > 0 && (
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-3">
              Top {langName} Artists
            </h4>
            <ul className="space-y-2 text-xs">
              {footerDetails.artists.slice(0, 10).map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => openDetails(item)}
                  className="hover:text-emerald-400 cursor-pointer transition truncate font-medium"
                >
                  {decodeHTMLEntities(item.title)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {footerDetails.actors?.length > 0 && (
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-3">
              Top {langName} Actors
            </h4>
            <ul className="space-y-2 text-xs">
              {footerDetails.actors.slice(0, 10).map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => openDetails(item)}
                  className="hover:text-emerald-400 cursor-pointer transition truncate font-medium"
                >
                  {decodeHTMLEntities(item.title)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {footerDetails.albums?.length > 0 && (
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-3">
              Top {langName} Albums
            </h4>
            <ul className="space-y-2 text-xs">
              {footerDetails.albums.slice(0, 10).map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => openDetails(item)}
                  className="hover:text-emerald-400 cursor-pointer transition truncate font-medium"
                >
                  {decodeHTMLEntities(item.title)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {footerDetails.playlists?.length > 0 && (
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-3">
              Top {langName} Playlists
            </h4>
            <ul className="space-y-2 text-xs">
              {footerDetails.playlists.slice(0, 10).map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => openDetails(item)}
                  className="hover:text-emerald-400 cursor-pointer transition truncate font-medium"
                >
                  {decodeHTMLEntities(item.title)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </footer>
  );
}
