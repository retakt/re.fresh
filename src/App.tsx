import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { DefaultProviders } from "./components/providers/default.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import AppLayout from "./pages/layout.tsx";
import { ChatProvider } from "./components/providers/chat.tsx";
import { NoticePanel } from "./components/notices/NoticePanel.tsx";
import { startConnectionMonitor } from "./lib/connection-monitor.ts";
import 'allotment/dist/style.css';

// ── All page routes lazy-loaded — nothing eagerly parsed on first paint ───────
const Index            = lazy(() => import("./pages/Index.tsx"));
const BlogPage         = lazy(() => import("./pages/blog/page.tsx"));
const BlogPostPage     = lazy(() => import("./pages/blog/post.tsx"));
const MusicPage        = lazy(() => import("./pages/music/page.tsx"));
const AlbumPage        = lazy(() => import("./pages/music/album.tsx"));
const SongPage         = lazy(() => import("./pages/music/song.tsx"));
const TutorialsPage    = lazy(() => import("./pages/tutorials/page.tsx"));
const TutorialPostPage = lazy(() => import("./pages/tutorials/post.tsx"));
const AboutPage        = lazy(() => import("./pages/about/page.tsx"));
const AccountPage      = lazy(() => import("./pages/account/page.tsx"));
const FilesPage        = lazy(() => import("./pages/files/page.tsx"));
const LoginPage        = lazy(() => import("./pages/login.tsx"));
const SignupPage       = lazy(() => import("./pages/signup.tsx"));
const NotFound         = lazy(() => import("./pages/NotFound.tsx"));
const SearchPage       = lazy(() => import("./pages/search/page.tsx"));
const ChatPage         = lazy(() => import("./pages/chat/page.tsx"));
const WhatsNewPage     = lazy(() => import("./pages/whats-new/page.tsx"));
const NoticePage       = lazy(() => import("./pages/notice/[id].tsx"));

// ── Admin / editor (already lazy) ────────────────────────────────────────────
const AdminPage          = lazy(() => import("./pages/admin/page.tsx"));
const EditorPage         = lazy(() => import("./pages/editor/page.tsx"));
const AdminPostsPage     = lazy(() => import("./pages/admin/posts.tsx"));
const PostEditorPage     = lazy(() => import("./pages/admin/post-editor.tsx"));
const AdminMusicPage     = lazy(() => import("./pages/admin/music.tsx"));
const MusicEditorPage    = lazy(() => import("./pages/admin/music-editor.tsx"));
const AdminTutorialsPage = lazy(() => import("./pages/admin/tutorials.tsx"));
const TutorialEditorPage = lazy(() => import("./pages/admin/tutorial-editor.tsx"));
const AdminFilesPage     = lazy(() => import("./pages/admin/files.tsx"));
const FileEditorPage     = lazy(() => import("./pages/admin/file-editor.tsx"));
const AdminMembersPage        = lazy(() => import("./pages/admin/members.tsx"));
const AdminQuotesPage         = lazy(() => import("./pages/admin/quotes.tsx"));
const AdminAccessRequestsPage = lazy(() => import("./pages/admin/access-requests.tsx"));
const YouTubeDownloaderPage   = lazy(() => import("./pages/admin/api-config.tsx"));

function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => { 
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

function AppContent() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      {/* Notice Panel - shows on first visit */}
      <NoticePanel />
      {/* Suspense with HTML shell-inspired loader */}
      <Suspense fallback={
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#0a0a0f'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Spinner with gradient border */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, transparent, #e11d48)',
              animation: 'spin 0.8s linear infinite',
              padding: '3px'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: '#0a0a0f'
              }} />
            </div>
            {/* Logo */}
            <span style={{
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              fontSize: '18px',
              letterSpacing: '-0.02em',
              fontWeight: 700,
              color: '#e5e5e5'
            }}>
              <span style={{ color: '#38bdf8' }}>re</span>
              <span style={{ color: '#e11d48' }}>.</span>
            </span>
          </div>
        </div>
      }>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/"                  element={<Index />} />
            <Route path="/blog"              element={<BlogPage />} />
            <Route path="/blog/:slug"        element={<BlogPostPage />} />
            <Route path="/music"             element={<MusicPage />} />
            <Route path="/music/album/:albumName" element={<AlbumPage />} />
            <Route path="/music/song/:id"    element={<SongPage />} />
            <Route path="/tutorials"         element={<TutorialsPage />} />
            <Route path="/tutorials/:slug"   element={<TutorialPostPage />} />
            <Route path="/about"             element={<AboutPage />} />
            <Route path="/account"           element={
              <ProtectedRoute><AccountPage /></ProtectedRoute>
            } />
            <Route path="/files"             element={<FilesPage />} />
            <Route path="/search"            element={<SearchPage />} />
            <Route path="/chat"              element={<ChatPage />} />
            <Route path="/whats-new"         element={<WhatsNewPage />} />
            
            {/* Notice share page */}
            <Route path="/n/:id"             element={<NoticePage />} />

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}>
                <Suspense>
                  <AdminPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/editor" element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}>
                <Suspense>
                  <EditorPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/posts" element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}>
                <Suspense>
                  <AdminPostsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/posts/new" element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}>
                <Suspense>
                  <PostEditorPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/posts/edit/:id" element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}>
                <Suspense>
                  <PostEditorPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/music" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Suspense>
                  <AdminMusicPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/music/new" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Suspense>
                  <MusicEditorPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/music/edit/:id" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Suspense>
                  <MusicEditorPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/tutorials" element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}>
                <Suspense>
                  <AdminTutorialsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/tutorials/new" element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}>
                <Suspense>
                  <TutorialEditorPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/tutorials/edit/:id" element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}>
                <Suspense>
                  <TutorialEditorPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/files" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Suspense>
                  <AdminFilesPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/files/new" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Suspense>
                  <FileEditorPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/files/edit/:id" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Suspense>
                  <FileEditorPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/members" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Suspense>
                  <AdminMembersPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/quotes" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Suspense>
                  <AdminQuotesPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/access-requests" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Suspense>
                  <AdminAccessRequestsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/api-config" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Suspense>
                  <YouTubeDownloaderPage />
                </Suspense>
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Auth routes - outside AppLayout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* 404 */}
          <Route path="*"      element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default function App() {
  // Start connection monitor on app mount
  useEffect(() => {
    startConnectionMonitor();
  }, []);

  return (
    <DefaultProviders>
      <ErrorBoundary>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </ErrorBoundary>
    </DefaultProviders>
  );
}
