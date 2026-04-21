import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { DefaultProviders } from "./components/providers/default.tsx";
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
import AdminPage from "./pages/admin/page.tsx";
import AdminPostsPage from "./pages/admin/posts.tsx";
import PostEditorPage from "./pages/admin/post-editor.tsx";
import AdminMusicPage from "./pages/admin/music.tsx";
import AdminTutorialsPage from "./pages/admin/tutorials.tsx";
import AdminFilesPage from "./pages/admin/files.tsx";
import AdminMembersPage from "./pages/admin/members.tsx";
import AdminQuotesPage from "./pages/admin/quotes.tsx";
import LoginPage from "./pages/login.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import NotFound from "./pages/NotFound.tsx";
import SongPage from "./pages/music/song.tsx";

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
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}><AdminPage /></ProtectedRoute>
            } />
            <Route path="/admin/posts" element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}><AdminPostsPage /></ProtectedRoute>
            } />
            <Route path="/admin/posts/new" element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}><PostEditorPage /></ProtectedRoute>
            } />
            <Route path="/admin/posts/edit/:id" element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}><PostEditorPage /></ProtectedRoute>
            } />
            <Route path="/admin/music" element={
              <ProtectedRoute allowedRoles={["admin"]}><AdminMusicPage /></ProtectedRoute>
            } />
            <Route path="/admin/tutorials" element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}><AdminTutorialsPage /></ProtectedRoute>
            } />
            <Route path="/admin/files" element={
              <ProtectedRoute allowedRoles={["admin"]}><AdminFilesPage /></ProtectedRoute>
            } />
            <Route path="/admin/members" element={
              <ProtectedRoute allowedRoles={["admin"]}><AdminMembersPage /></ProtectedRoute>
            } />
            {/* ── Quotes ── */}
            <Route path="/admin/quotes" element={
              <ProtectedRoute allowedRoles={["admin"]}><AdminQuotesPage /></ProtectedRoute>
            } />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}
