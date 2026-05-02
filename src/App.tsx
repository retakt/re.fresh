import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { DefaultProviders } from "./components/providers/default.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import AppLayout from "./pages/layout.tsx";
import { ChatProvider } from "./components/providers/chat.tsx";
import { CommandPalette } from "./components/ui/command-palette.tsx";
import { CommandPaletteProvider, useCommandPalette } from "./components/providers/command-palette.tsx";

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

function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => { 
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

function AppContent() {
  const { isOpen, close } = useCommandPalette();

  return (
    <BrowserRouter>
      <ScrollToTop />
      <CommandPalette isOpen={isOpen} onClose={close} />
      {/* No fallback - let the index.html shell handle initial loading */}
      <Suspense>
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
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*"      element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <DefaultProviders>
      <ErrorBoundary>
        <CommandPaletteProvider>
          <ChatProvider>
            <AppContent />
          </ChatProvider>
        </CommandPaletteProvider>
      </ErrorBoundary>
    </DefaultProviders>
  );
}
