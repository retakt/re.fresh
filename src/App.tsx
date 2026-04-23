import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { DefaultProviders } from "./components/providers/default.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { PageLoadingFallback } from "./components/ui/page-loading-fallback.tsx";
import { AdminTableSkeleton, PostDetailSkeleton } from "./components/ui/skeleton.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
// AppLayout MUST be eagerly imported — it uses context from DefaultProviders
// and lazy-loading it breaks useContext resolution across the Suspense boundary
import AppLayout from "./pages/layout.tsx";

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
const NotFound         = lazy(() => import("./pages/NotFound.tsx"));
const SearchPage       = lazy(() => import("./pages/search/page.tsx"));

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
const AdminMembersPage   = lazy(() => import("./pages/admin/members.tsx"));
const AdminQuotesPage    = lazy(() => import("./pages/admin/quotes.tsx"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <DefaultProviders>
      <ErrorBoundary>
        <BrowserRouter>
          <ScrollToTop />
          {/* Single top-level Suspense — PageLoadingFallback shows on first load */}
          <Suspense fallback={<PageLoadingFallback />}>
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

                {/* Admin routes */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={["admin", "editor"]}>
                    <Suspense fallback={<AdminTableSkeleton rows={5} />}>
                      <AdminPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/editor" element={
                  <ProtectedRoute allowedRoles={["admin", "editor"]}>
                    <Suspense fallback={<AdminTableSkeleton rows={2} />}>
                      <EditorPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/posts" element={
                  <ProtectedRoute allowedRoles={["admin", "editor"]}>
                    <Suspense fallback={<AdminTableSkeleton rows={3} />}>
                      <AdminPostsPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/posts/new" element={
                  <ProtectedRoute allowedRoles={["admin", "editor"]}>
                    <Suspense fallback={<PostDetailSkeleton />}>
                      <PostEditorPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/posts/edit/:id" element={
                  <ProtectedRoute allowedRoles={["admin", "editor"]}>
                    <Suspense fallback={<PostDetailSkeleton />}>
                      <PostEditorPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/music" element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Suspense fallback={<AdminTableSkeleton rows={4} />}>
                      <AdminMusicPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/music/new" element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Suspense fallback={<PostDetailSkeleton />}>
                      <MusicEditorPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/music/edit/:id" element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Suspense fallback={<PostDetailSkeleton />}>
                      <MusicEditorPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/tutorials" element={
                  <ProtectedRoute allowedRoles={["admin", "editor"]}>
                    <Suspense fallback={<AdminTableSkeleton rows={3} />}>
                      <AdminTutorialsPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/tutorials/new" element={
                  <ProtectedRoute allowedRoles={["admin", "editor"]}>
                    <Suspense fallback={<PostDetailSkeleton />}>
                      <TutorialEditorPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/tutorials/edit/:id" element={
                  <ProtectedRoute allowedRoles={["admin", "editor"]}>
                    <Suspense fallback={<PostDetailSkeleton />}>
                      <TutorialEditorPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/files" element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Suspense fallback={<AdminTableSkeleton rows={3} />}>
                      <AdminFilesPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/files/new" element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Suspense fallback={<PostDetailSkeleton />}>
                      <FileEditorPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/files/edit/:id" element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Suspense fallback={<PostDetailSkeleton />}>
                      <FileEditorPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/members" element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Suspense fallback={<AdminTableSkeleton rows={5} />}>
                      <AdminMembersPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/quotes" element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Suspense fallback={<AdminTableSkeleton rows={3} />}>
                      <AdminQuotesPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
              </Route>
              <Route path="/login" element={<LoginPage />} />
              <Route path="*"      element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </DefaultProviders>
  );
}
