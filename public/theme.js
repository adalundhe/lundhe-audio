;(function initTheme() {

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");


    let mode = localStorage.getItem('ui-mode') || 'system'
    if (mode === 'system') {
        mode = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"
    }


    document && document?.querySelector('html')?.classList.add(mode)
  })()