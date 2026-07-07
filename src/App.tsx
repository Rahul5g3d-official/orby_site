import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { HomePage } from "./routes/HomePage";
import { PhoneCameraPage } from "./routes/PhoneCameraPage";
import { RecordingsPage } from "./routes/RecordingsPage";
import { StudioPage } from "./routes/StudioPage";

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/recordings" element={<RecordingsPage />} />
        <Route path="/phone-camera/:roomId" element={<PhoneCameraPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
