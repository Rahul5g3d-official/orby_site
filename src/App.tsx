import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { HomePage } from "./routes/HomePage";
import { OpenSourcePage } from "./routes/OpenSourcePage";
import { PrivacyPage } from "./routes/PrivacyPage";
import { RecordingsPage } from "./routes/RecordingsPage";
import { StudioPage } from "./routes/StudioPage";

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/recordings" element={<RecordingsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/open-source" element={<OpenSourcePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
