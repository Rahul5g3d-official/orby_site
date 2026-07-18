import { Card } from "../components/ui/Card";

const linkClassName =
  "font-medium text-studio-cyan underline decoration-studio-cyan/40 underline-offset-4 transition hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-studio-bg";

export function OpenSourcePage() {
  return (
    <main className="mx-auto w-full max-w-[920px] px-4 py-8 sm:px-6 sm:py-12">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-studio-text sm:text-3xl">
          Open Source
        </h1>
        <p className="mt-3 text-sm leading-6 text-studio-muted sm:text-base">
          Orby is an open-source, browser-based recording platform.
        </p>
      </header>

      <div className="mt-8 grid gap-4">
        <Card className="p-5 sm:p-6">
          <section>
            <h2 className="text-lg font-semibold text-studio-text">
              Source code
            </h2>
            <p className="mt-2 text-sm leading-6 text-studio-muted">
              The project source is available on GitHub. You can inspect the
              code, report an issue, or contribute.
            </p>
            <p className="mt-3 text-sm leading-6">
              <a
                href="https://github.com/Rahul5g3d-official/screen_recorder"
                target="_blank"
                rel="noreferrer"
                className={linkClassName}
              >
                View Orby on GitHub
              </a>
            </p>
          </section>
        </Card>

        <Card className="p-5 sm:p-6">
          <section>
            <h2 className="text-lg font-semibold text-studio-text">
              Special requests
            </h2>
            <p className="mt-2 text-sm leading-6 text-studio-muted">
              If you have any issue, please send an Email{" "}
              <a
                href="mailto:Rahul5g3d.official@gmail.com"
                className={linkClassName}
              >
                124111009@nitkkr.ac.in
              </a>
              .
            </p>
          </section>
        </Card>
      </div>
    </main>
  );
}
