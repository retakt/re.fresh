import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { DefaultProviders } from "./components/providers/default.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { AdminTableSkeleton, PostDetailSkeleton } from "./components/ui/skeleton.tsx";
import AppLayout from "./pages/layout.tsx";
import Index from "./pages/Index.tsx";
import BlogPage from "./pages/blog/page.tsx";
import BlogPostPage from "./pages/blog/post.tsx";
import MusicPage from "./pages/music/page.tsx";
import AlbumPage from "./pages/music/album.tsx";
import TutorialsPage from "./pages/tutorials/page.tsx";
import TutorialPostPage from "./pages/tutorials/post.tsx";
import AboutPage from "./pages/about/page.tsx";
import AccountPage from "./pages/account/page.tsx";
import FilesPage from "./pages/files/page.tsx";
import LoginPage from "./pages/login.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import NotFound from "./pages/NotFound.tsx";
import SongPage from "./pages/music/song.tsx";

// Lazy load heavy admin pages
const AdminPage = lazy(() => import("./pages/admin/page.tsx"));
const AdminPostsPage = lazy(() => import("./pages/admin/posts.tsx"));
const PostEditorPage = lazy(() => import("./pages/admin/post-editor.tsx"));
const AdminMusicPage = lazy(() => import("./pages/admin/music.tsx"));
const AdminTutorialsPage = lazy(() => import("./pages/admin/tutorials.tsx"));
const AdminFilesPage = lazy(() => import("./pages/admin/files.tsx"));
const AdminMembersPage = lazy(() => import("./pages/admin/members.tsx"));
const AdminQuotesPage = lazy(() => import("./pages/admin/quotes.tsx"));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <DefaultProviders>
      <ErrorBoundary>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/music" element={<MusicPage />} />
              <Route path="/music/album/:albumName" element={<AlbumPage />} />
              <Route path="/music/song/:id" element={<SongPage />} />
              <Route path="/tutorials" element={<TutorialsPage />} />
              <Route path="/tutorials/:slug" element={<TutorialPostPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/account" element={
                <ProtectedRoute><AccountPage /></ProtectedRoute>
              } />
              <Route path="/files" element={<FilesPage />} />
              
              {/* Admin routes with lazy loading and suspense */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={["admin", "editor"]}>
                  <Suspense fallback={<AdminTableSkeleton rows={5} />}>
                    <AdminPage />
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
              <Route path="/admin/tutorials" element={
                <ProtectedRoute allowedRoles={["admin", "editor"]}>
                  <Suspense fallback={<AdminTableSkeleton rows={3} />}>
                    <AdminTutorialsPage />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </DefaultProviders>
  );
}
