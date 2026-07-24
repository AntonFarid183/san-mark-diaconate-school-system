import { createContext, useContext, useEffect, useState } from 'react';

const PageTitleContext = createContext(() => {});

// Layout (mounted once, shared across every route via <Outlet/>) provides
// the setter; individual pages call usePageTitle(title) to put their
// heading in the persistent topbar without Layout remounting per navigation.
export function PageTitleProvider({ children }) {
  const [title, setTitle] = useState('');
  return (
    <PageTitleContext.Provider value={setTitle}>
      {children(title)}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle(title) {
  const setTitle = useContext(PageTitleContext);
  useEffect(() => { setTitle(title); }, [title, setTitle]);
}
