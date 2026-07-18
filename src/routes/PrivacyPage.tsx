import { Card } from "../components/ui/Card";

export function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-[920px] px-4 py-8 sm:px-6 sm:py-12">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-studio-text sm:text-3xl">
          Privacy &amp; Local Data
        </h1>
        <p className="mt-3 text-sm leading-6 text-studio-muted sm:text-base">
          Orby processes screen, camera, and microphone media in your browser.
          Your recording files are not uploaded to an Orby server.
        </p>
      </header>

      <div className="mt-8 grid gap-4">
        <Card className="p-5 sm:p-6">
          <section>
            <h2 className="text-lg font-semibold text-studio-text">
              Media permissions
            </h2>
            <p className="mt-2 text-sm leading-6 text-studio-muted">
              Screen, camera, and microphone access begins only after you choose
              a source and approve the browser permission. You can stop active
              sources from the Studio.
            </p>
          </section>
        </Card>

        <Card className="p-5 sm:p-6">
          <section>
            <h2 className="text-lg font-semibold text-studio-text">
              Local storage
            </h2>
            <p className="mt-2 text-sm leading-6 text-studio-muted">
              Recordings you save are stored in this browser on this device.
              Downloads are saved through your browser to the location you
              choose.
            </p>
          </section>
        </Card>

        <Card className="p-5 sm:p-6">
          <section>
            <h2 className="text-lg font-semibold text-studio-text">
              Your control
            </h2>
            <p className="mt-2 text-sm leading-6 text-studio-muted">
              You can delete saved recordings from the Recordings page, revoke
              media permissions in your browser settings, or clear this site’s
              data to remove locally saved recordings.
            </p>
          </section>
        </Card>
      </div>
    </main>
  );
}
