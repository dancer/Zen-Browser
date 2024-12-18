import { useState, useEffect } from 'react';
import { WebviewWindow, getCurrent, appWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/tauri';

interface Tab {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
}

function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHome, setShowHome] = useState(true);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'home', title: 'New Tab', url: '', isActive: true }
  ]);

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    setIsLoading(true);
    
    try {
      let validUrl = url;
      
      // Check if it's already a valid URL
      if (!isValidUrl(validUrl)) {
        // Check if it's a domain-like input (e.g., "google.com")
        if (/^[\w-]+(\.[\w-]+)+$/.test(validUrl)) {
          validUrl = `https://${validUrl}`;
        } else {
          // If not, treat it as a search query
          validUrl = `https://www.google.com/search?q=${encodeURIComponent(validUrl)}`;
        }
      }

      await invoke('navigate_to', { url: validUrl });
      setShowHome(false);
      
      // Update active tab
      setTabs(currentTabs => 
        currentTabs.map(tab => 
          tab.isActive ? { ...tab, url: validUrl, title: url } : tab
        )
      );
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await invoke('refresh_page');
    } catch (error) {
      console.error('Refresh error:', error);
    }
  };

  const handleBack = async () => {
    try {
      await invoke('go_back');
    } catch (error) {
      console.error('Back error:', error);
    }
  };

  const handleForward = async () => {
    try {
      await invoke('go_forward');
    } catch (error) {
      console.error('Forward error:', error);
    }
  };

  const handleHome = async () => {
    try {
      await invoke('close_content');
    } catch (error) {
      console.error('Error closing content:', error);
    }
    setShowHome(true);
    setUrl('');
    setTabs(currentTabs =>
      currentTabs.map(tab =>
        tab.isActive ? { ...tab, url: '', title: 'New Tab' } : tab
      )
    );
  };

  const addNewTab = () => {
    setTabs(currentTabs => [
      ...currentTabs.map(tab => ({ ...tab, isActive: false })),
      { id: `tab-${Date.now()}`, title: 'New Tab', url: '', isActive: true }
    ]);
    setShowHome(true);
    setUrl('');
  };

  const closeTab = (tabId: string) => {
    setTabs(currentTabs => {
      const tabIndex = currentTabs.findIndex(tab => tab.id === tabId);
      if (currentTabs.length === 1) return currentTabs;
      
      const newTabs = currentTabs.filter(tab => tab.id !== tabId);
      if (currentTabs[tabIndex].isActive) {
        const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
        newTabs[newActiveIndex].isActive = true;
        setUrl(newTabs[newActiveIndex].url);
        setShowHome(!newTabs[newActiveIndex].url);
      }
      return newTabs;
    });
  };

  const switchTab = (tabId: string) => {
    setTabs(currentTabs =>
      currentTabs.map(tab => ({
        ...tab,
        isActive: tab.id === tabId
      }))
    );
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setUrl(tab.url);
      setShowHome(!tab.url);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-darker)]">
      {/* UI Layer - Always on top */}
      <div className="flex flex-col z-[100]">
        {/* Title Bar */}
        <div data-tauri-drag-region className="title-bar flex items-center gap-2 px-2 pointer-events-auto">
          <div className="flex items-center gap-1 min-w-[120px] no-drag">
            <button onClick={handleBack} className="nav-button" title="Back">←</button>
            <button onClick={handleForward} className="nav-button" title="Forward">→</button>
            <button onClick={handleRefresh} className="nav-button" title="Refresh">↻</button>
            <button onClick={handleHome} className="nav-button" title="Home">⌂</button>
          </div>

          {/* Search Bar */}
          {!showHome && (
            <form onSubmit={handleUrlSubmit} className="flex-1 mx-4 no-drag">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="search-bar text-xs"
                placeholder="Search with Google or enter address"
              />
            </form>
          )}

          {/* Window Controls */}
          <div className="window-controls flex no-drag">
            <button onClick={() => appWindow.minimize()} className="window-button" title="Minimize">─</button>
            <button onClick={() => appWindow.toggleMaximize()} className="window-button" title="Maximize">□</button>
            <button onClick={() => appWindow.close()} className="window-button close-button" title="Close">×</button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="tab-bar flex items-center pointer-events-auto">
          <div className="flex-1 flex">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`tab ${tab.isActive ? 'active' : ''}`}
                onClick={() => switchTab(tab.id)}
              >
                <span className="truncate max-w-[120px]">
                  {tab.title}
                </span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="ml-2 hover:text-[var(--accent-pink)]"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addNewTab}
            className="new-tab-button"
            title="New Tab"
          >
            +
          </button>
        </div>
      </div>

      {/* Content Layer */}
      <div className="flex-1 relative">
        {showHome ? (
          <div className="h-full flex flex-col items-center justify-center bg-[var(--bg-darker)]">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4 text-[var(--text-primary)]">RENGAR</h1>
              <div className="search-container w-[600px] mx-auto">
                <form onSubmit={handleUrlSubmit} className="no-drag">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="search-bar text-sm w-full"
                    placeholder="Search with Google or enter address"
                    autoFocus
                  />
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div 
            id="webview-container"
            className="absolute inset-0 bg-white"
            style={{ height: 'calc(100vh - 72px)' }}
          />
        )}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-darker)]/80 z-[45]">
            <div className="text-[var(--text-primary)] text-sm animate-pulse">Loading...</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 