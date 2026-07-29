import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { CloneTrayProvider } from '@/context/CloneTrayContext';
import { RequireAuth } from '@/components/RequireAuth';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Upload } from '@/pages/Upload';
import { Clone } from '@/pages/Clone';
import { Library } from '@/pages/Library';
import { FolderOwner } from '@/pages/FolderOwner';
import { FolderShared } from '@/pages/FolderShared';
import { Embed } from '@/pages/Embed';
import { Download } from '@/pages/Download';
import { Settings } from '@/pages/Settings';
import { NotFound } from '@/pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <CloneTrayProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/upload" element={<RequireAuth><Upload /></RequireAuth>} />
              <Route path="/clone" element={<RequireAuth><Clone /></RequireAuth>} />
              <Route path="/library" element={<RequireAuth><Library /></RequireAuth>} />
              <Route path="/folder/:folderId" element={<RequireAuth><FolderOwner /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
              <Route path="/f/:folderId" element={<FolderShared />} />
              <Route path="/e/:videoId" element={<Embed />} />
              <Route path="/d/:videoId" element={<Download />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CloneTrayProvider>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
